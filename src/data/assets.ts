export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  icon: string;
  iconUrl: string;
  payout: number;
  decimals: number;
  tvSymbol: string; // TradingView symbol
}

export const cryptoAssets: Asset[] = [
  { id: "btc", symbol: "BTC/USDT", name: "Bitcoin", price: 97250.00, changePercent: 1.30, icon: "₿", iconUrl: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", payout: 85, decimals: 2, tvSymbol: "BINANCE:BTCUSDT" },
  { id: "eth", symbol: "ETH/USDT", name: "Ethereum", price: 3485.50, changePercent: 1.31, icon: "Ξ", iconUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", payout: 85, decimals: 2, tvSymbol: "BINANCE:ETHUSDT" },
  { id: "bnb", symbol: "BNB/USDT", name: "BNB", price: 685.30, changePercent: -1.23, icon: "🔶", iconUrl: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", payout: 82, decimals: 2, tvSymbol: "BINANCE:BNBUSDT" },
  { id: "sol", symbol: "SOL/USDT", name: "Solana", price: 195.40, changePercent: 3.06, icon: "◎", iconUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png", payout: 82, decimals: 2, tvSymbol: "BINANCE:SOLUSDT" },
  { id: "xrp", symbol: "XRP/USDT", name: "XRP", price: 2.35, changePercent: 0.85, icon: "X", iconUrl: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", payout: 82, decimals: 4, tvSymbol: "BINANCE:XRPUSDT" },
  { id: "ada", symbol: "ADA/USDT", name: "Cardano", price: 0.72, changePercent: -0.54, icon: "₳", iconUrl: "https://assets.coingecko.com/coins/images/975/small/cardano.png", payout: 80, decimals: 4, tvSymbol: "BINANCE:ADAUSDT" },
  { id: "doge", symbol: "DOGE/USDT", name: "Dogecoin", price: 0.185, changePercent: 2.15, icon: "Ð", iconUrl: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", payout: 80, decimals: 5, tvSymbol: "BINANCE:DOGEUSDT" },
  { id: "avax", symbol: "AVAX/USDT", name: "Avalanche", price: 38.50, changePercent: 1.78, icon: "A", iconUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", payout: 82, decimals: 2, tvSymbol: "BINANCE:AVAXUSDT" },
  { id: "dot", symbol: "DOT/USDT", name: "Polkadot", price: 7.45, changePercent: -0.92, icon: "●", iconUrl: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png", payout: 80, decimals: 3, tvSymbol: "BINANCE:DOTUSDT" },
  { id: "link", symbol: "LINK/USDT", name: "Chainlink", price: 18.25, changePercent: 1.45, icon: "⬡", iconUrl: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", payout: 80, decimals: 2, tvSymbol: "BINANCE:LINKUSDT" },
  { id: "matic", symbol: "POL/USDT", name: "Polygon", price: 0.52, changePercent: -1.10, icon: "M", iconUrl: "https://assets.coingecko.com/coins/images/4713/small/polygon.png", payout: 80, decimals: 4, tvSymbol: "BINANCE:POLUSDT" },
  { id: "shib", symbol: "SHIB/USDT", name: "Shiba Inu", price: 0.0000245, changePercent: 3.20, icon: "S", iconUrl: "https://assets.coingecko.com/coins/images/11939/small/shiba.png", payout: 78, decimals: 8, tvSymbol: "BINANCE:SHIBUSDT" },
  { id: "ltc", symbol: "LTC/USDT", name: "Litecoin", price: 108.50, changePercent: 0.65, icon: "Ł", iconUrl: "https://assets.coingecko.com/coins/images/2/small/litecoin.png", payout: 82, decimals: 2, tvSymbol: "BINANCE:LTCUSDT" },
  { id: "uni", symbol: "UNI/USDT", name: "Uniswap", price: 12.80, changePercent: 2.30, icon: "U", iconUrl: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg", payout: 80, decimals: 2, tvSymbol: "BINANCE:UNIUSDT" },
  { id: "atom", symbol: "ATOM/USDT", name: "Cosmos", price: 9.15, changePercent: -0.35, icon: "⚛", iconUrl: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png", payout: 80, decimals: 3, tvSymbol: "BINANCE:ATOMUSDT" },
  { id: "xlm", symbol: "XLM/USDT", name: "Stellar", price: 0.128, changePercent: 0.90, icon: "*", iconUrl: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png", payout: 78, decimals: 4, tvSymbol: "BINANCE:XLMUSDT" },
  { id: "near", symbol: "NEAR/USDT", name: "NEAR Protocol", price: 5.35, changePercent: 1.65, icon: "N", iconUrl: "https://assets.coingecko.com/coins/images/10365/small/near.jpg", payout: 80, decimals: 3, tvSymbol: "BINANCE:NEARUSDT" },
  { id: "apt", symbol: "APT/USDT", name: "Aptos", price: 9.80, changePercent: -1.45, icon: "A", iconUrl: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png", payout: 80, decimals: 3, tvSymbol: "BINANCE:APTUSDT" },
  { id: "fil", symbol: "FIL/USDT", name: "Filecoin", price: 5.95, changePercent: 0.42, icon: "F", iconUrl: "https://assets.coingecko.com/coins/images/12817/small/filecoin.png", payout: 78, decimals: 3, tvSymbol: "BINANCE:FILUSDT" },
  { id: "arb", symbol: "ARB/USDT", name: "Arbitrum", price: 1.15, changePercent: 2.80, icon: "A", iconUrl: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg", payout: 80, decimals: 4, tvSymbol: "BINANCE:ARBUSDT" },
  { id: "op", symbol: "OP/USDT", name: "Optimism", price: 2.45, changePercent: -0.78, icon: "O", iconUrl: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png", payout: 80, decimals: 4, tvSymbol: "BINANCE:OPUSDT" },
  { id: "sui", symbol: "SUI/USDT", name: "Sui", price: 3.65, changePercent: 4.20, icon: "S", iconUrl: "https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png", payout: 80, decimals: 3, tvSymbol: "BINANCE:SUIUSDT" },
  { id: "sei", symbol: "SEI/USDT", name: "Sei", price: 0.58, changePercent: 1.95, icon: "S", iconUrl: "https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png", payout: 78, decimals: 4, tvSymbol: "BINANCE:SEIUSDT" },
  { id: "inj", symbol: "INJ/USDT", name: "Injective", price: 28.50, changePercent: -2.10, icon: "I", iconUrl: "https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png", payout: 80, decimals: 2, tvSymbol: "BINANCE:INJUSDT" },
  { id: "trx", symbol: "TRX/USDT", name: "TRON", price: 0.118, changePercent: 0.35, icon: "T", iconUrl: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png", payout: 78, decimals: 4, tvSymbol: "BINANCE:TRXUSDT" },
  { id: "etc", symbol: "ETC/USDT", name: "Ethereum Classic", price: 27.80, changePercent: -0.65, icon: "E", iconUrl: "https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png", payout: 80, decimals: 2, tvSymbol: "BINANCE:ETCUSDT" },
  { id: "vet", symbol: "VET/USDT", name: "VeChain", price: 0.038, changePercent: 1.20, icon: "V", iconUrl: "https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png", payout: 78, decimals: 5, tvSymbol: "BINANCE:VETUSDT" },
  { id: "algo", symbol: "ALGO/USDT", name: "Algorand", price: 0.225, changePercent: -0.45, icon: "A", iconUrl: "https://assets.coingecko.com/coins/images/4380/small/download.png", payout: 78, decimals: 4, tvSymbol: "BINANCE:ALGOUSDT" },
  { id: "ftm", symbol: "FTM/USDT", name: "Fantom", price: 0.82, changePercent: 2.55, icon: "F", iconUrl: "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png", payout: 78, decimals: 4, tvSymbol: "BINANCE:FTMUSDT" },
  { id: "eurusd", symbol: "EUR/USD", name: "Euro/Dollar", price: 1.135, changePercent: 0.12, icon: "€", iconUrl: "https://flagcdn.com/w40/eu.png", payout: 80, decimals: 5, tvSymbol: "FX:EURUSD" },
  { id: "xauusd", symbol: "XAU/USD", name: "Gold", price: 2925.50, changePercent: 0.85, icon: "Au", iconUrl: "/gold-icon.png", payout: 82, decimals: 2, tvSymbol: "OANDA:XAUUSD" },
];

export const defaultAsset = cryptoAssets[0];

export const getAssetById = (id: string) => cryptoAssets.find((a) => a.id === id);
