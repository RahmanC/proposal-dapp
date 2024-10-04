import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { formatEther } from "ethers";
import useVote from "../hooks/useVote";
import useExecuteProposal from "../hooks/useExecuteProposal";

const Proposal = ({
  description,
  amount,
  minRequiredVote,
  votecount,
  deadline,
  executed,
  proposalId,
}) => {
  const { vote, isLoading } = useVote();

  const { executeProposal, isLoading: loading } = useExecuteProposal();

  const currentTime = Math.floor(Date.now() / 1000);

  // Check if the deadline has passed
  const hasDeadlinePassed = currentTime > Number(deadline);

  const reqVotes = votecount >= minRequiredVote;

  const canExecute = hasDeadlinePassed && reqVotes;

  const executeLabel = () => {
    if (executed) {
      return "Proposal Executed";
    } else if (loading) {
      return "Executing...";
    }
    return "Execute Proposal";
  };

  const voteLabel = () => {
    if (hasDeadlinePassed) {
      return "Voting Closed";
    } else if (loading) {
      return "Voting...";
    }
    return "Vote";
  };

  return (
    <Box className="bg-slate-400 rounded-md shadow-sm p-4 w-96">
      <Text className="text-2xl mb-4">Proposals</Text>
      <Box className="w-full">
        <Flex className="flex gap-4">
          <Text>Description:</Text>
          <Text className="font-bold">{description}</Text>
        </Flex>
        <Flex className="flex gap-4">
          <Text>Amount:</Text>
          <Text className="font-bold">{formatEther(amount)} ETH</Text>
        </Flex>
        <Flex className="flex gap-4">
          <Text>Required Vote:</Text>
          <Text className="font-bold">{Number(minRequiredVote)}</Text>
        </Flex>
        <Flex className="flex gap-4">
          <Text>Vote Count:</Text>
          <Text className="font-bold">{Number(votecount)}</Text>
        </Flex>
        <Flex className="flex gap-4">
          <Text>Deadline:</Text>
          <Text className="font-bold">
            {new Date(Number(deadline) * 1000).toLocaleDateString()}
          </Text>
        </Flex>
        <Flex className="flex gap-4">
          <Text>Executed:</Text>
          <Text className="font-bold">{String(executed)}</Text>
        </Flex>
      </Box>

      <Button
        onClick={() => vote(proposalId)}
        disabled={executed || isLoading || hasDeadlinePassed}
        className="bg-blue-500 text-white font-bold w-full mt-4 p-4 rounded-md shadow-sm"
      >
        {voteLabel()}
      </Button>

      {canExecute && (
        <button
          onClick={() => !executed && executeProposal(proposalId)}
          disabled={loading}
          className={`${
            executed ? "bg-green-900" : "bg-green-400"
          } text-white font-bold w-full mt-4 p-4 rounded-md shadow-sm`}
        >
          {executeLabel()}
        </button>
      )}
    </Box>
  );
};

export default Proposal;
