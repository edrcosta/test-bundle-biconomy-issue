import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import type { Hex } from 'viem';
import { getActiveChain } from '../config/chains';
import { BALANCE_REFETCH_INTERVAL } from '../config/constants';

export function useTokenBalance(tokenAddress: string, account: string | null) {
  const { data: balance, isLoading, isError, refetch } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress as Hex,
    chainId: getActiveChain().id,
    functionName: 'balanceOf',
    args: account ? [account as Hex] : undefined,
    query: {
      enabled: !!account,
      refetchInterval: BALANCE_REFETCH_INTERVAL
    }
  });

  return { balance, isLoading, isError, refetch };
}
