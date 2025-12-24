export const TRANSFER_AMOUNT = 10000n;
// 0.01 USDC (6 decimals)
export const TRANSFER_AMOUNT_USDC = 10000n;
export const USE_MAINNET = false;
export const USDC_ADDRESS = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
export const MOCK_DIV_ADDRESS = '0x926394525525a86Ef0a847698742dfBD9D42E6B3';

export function getBiconomyApiKey() {
    return '';
}

export function getCurrencyAddress() {
    return USE_MAINNET ? USDC_ADDRESS : MOCK_DIV_ADDRESS;
}

export const USDC_NAME = 'USDC';
export const MOCK_DIV_NAME = 'MOCK DIV';

export function getCurrencyName(){
    return USE_MAINNET ? USDC_NAME : MOCK_DIV_NAME;
}


export const WALLETCONNECT_PROJECT_ID = '';

export const MEE_SCAN_BASE_URL = 'https://www.meescan.biconomy.io/supertransaction';

export const BALANCE_REFETCH_INTERVAL = 5000;
