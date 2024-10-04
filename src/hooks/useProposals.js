import { useCallback, useEffect, useState } from "react";
import { Contract } from "ethers";
import { Interface } from "ethers";
import ABI from "../ABI/proposal.json";

const multicallAbi = [
  "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls) returns ((bool success, bytes returnData)[] returnData)",
];

const useProposals = (readOnlyContract, readOnlyProvider) => {
  const [proposals, setProposals] = useState([]);

  const fetchProposals = useCallback(async () => {
    if (!readOnlyContract) return;

    const multicallContract = new Contract(
      import.meta.env.VITE_MULTICALL_ADDRESS,
      multicallAbi,
      readOnlyProvider
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
  }, [readOnlyContract, readOnlyProvider]);

  useEffect(() => {
    fetchProposals();

    const contract = new Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS,
      ABI,
      readOnlyProvider
    );

    contract.on("ProposalCreated", fetchProposals);
    contract.on("Voted", fetchProposals);
    contract.on("ProposalExecuted", fetchProposals);

    return () => {
      contract.removeAllListeners("ProposalCreated");
      contract.removeAllListeners("Voted");
      contract.removeAllListeners("ProposalExecuted");
    };
  }, [fetchProposals, readOnlyProvider]);

  return { proposals, fetchProposals };
};

export default useProposals;
