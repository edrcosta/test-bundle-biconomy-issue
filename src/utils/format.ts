export function formatBalance(balance: bigint | undefined, decimals: number = 6): string {
  if (!balance) return '0';
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;
  return `${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`;
}

export function getMeeScanLink(hash: string): string {
  return `https://www.meescan.biconomy.io/supertransaction/${hash}`;
}
