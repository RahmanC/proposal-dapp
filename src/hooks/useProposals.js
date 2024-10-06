import { useCallback, useEffect, useState } from "react";
import { Contract, Interface } from "ethers";
import ABI from "../ABI/proposal.json";
import { jsonRpcProvider } from "../constants/provider";

const multicallAbi = [
  "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls) returns ((bool success, bytes returnData)[] returnData)",
];

const useProposals = () => {
  const [proposals, setProposals] = useState([]);

  const fetchProposals = useCallback(async () => {
    const readOnlyContract = new Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS,
      ABI,
      jsonRpcProvider
    );

    const multicallContract = new Contract(
      import.meta.env.VITE_MULTICALL_ADDRESS,
      multicallAbi,
      jsonRpcProvider
    );

    const itf = new Interface(ABI);

    try {
      const proposalCount = Number(await readOnlyContract.proposalCount());
      const proposalsIds = Array.from(
        { length: proposalCount - 1 },
        (_, i) => i + 1
      );

      const calls = proposalsIds.map((id) => ({
        target: import.meta.env.VITE_CONTRACT_ADDRESS,
        callData: itf.encodeFunctionData("proposals", [id]),
      }));

      const responses = await multicallContract.tryAggregate.staticCall(
        true,
        calls
      );

      const decodedResults = responses.map((res) =>
        itf.decodeFunctionResult("proposals", res.returnData)
      );

      const data = decodedResults.map((proposalStruct) => ({
        description: proposalStruct.description,
        amount: proposalStruct.amount,
        minRequiredVote: proposalStruct.minVotesToPass,
        votecount: proposalStruct.voteCount,
        deadline: proposalStruct.votingDeadline,
        executed: proposalStruct.executed,
      }));

      setProposals(data);
    } catch (error) {
      console.log("Error fetching proposals: ", error);
    }
  }, []);

  useEffect(() => {
    fetchProposals();

    const contract = new Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS,
      ABI,
      jsonRpcProvider
    );

    contract.on("ProposalCreated", fetchProposals);
    contract.on("Voted", fetchProposals);
    contract.on("ProposalExecuted", fetchProposals);

    return () => {
      contract.removeAllListeners("ProposalCreated");
      contract.removeAllListeners("Voted");
      contract.removeAllListeners("ProposalExecuted");
    };
  }, [fetchProposals]);

  return { proposals, fetchProposals };
};

export default useProposals;
