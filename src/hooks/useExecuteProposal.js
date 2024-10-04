import useContract from "./useContract";
import { liskSepoliaNetwork } from "../connection";

import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

const useExecuteProposal = () => {
  const contract = useContract(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  const [isLoading, setIsLoading] = useState(false);

  const executeProposal = useCallback(
    async (proposalId) => {
      if (!address) {
        toast.error("Connect your wallet!");
        return;
      }

      if (Number(chainId) !== liskSepoliaNetwork.chainId) {
        toast.error("You are not connected to the right network");
        return;
      }

      if (!contract) {
        toast.error("Cannot get contract!");
        return;
      }

      setIsLoading(true);
      try {
        const estimatedGas = await contract.executeProposal.estimateGas(
          proposalId
        );

        const tx = await contract.executeProposal(proposalId, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Proposal executed successfully!");
        } else {
          toast.error("Proposal execution failed");
        }
      } catch (error) {
        console.error("Error executing proposal: ", error);
        toast.error("Proposal execution errored");
      } finally {
        setIsLoading(false);
      }
    },
    [address, chainId, contract]
  );

  return { executeProposal, isLoading };
};

export default useExecuteProposal;
