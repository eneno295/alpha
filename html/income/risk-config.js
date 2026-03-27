/**
 * 交易所风险参数配置（固定变量）
 *
 * 说明：
 * 1) 该文件专门维护“平台 -> 币种”的固定参数，便于后续扩展和维护。
 * 2) tiers 的单位使用“币数量上限”（例如 ETH 数量、BTC 数量），rate 为百分比。
 */
(function () {
  window.EXCHANGE_RISK_CONFIG = {
    okx: {
      label: "OKX",
      symbols: {
        ETH: {
          // ETH 档位
          makerFeeRate: 0.02,
          takerFeeRate: 0.05,
          tiers: [
            { cap: 5000, rate: 0.40 },
            { cap: 10000, rate: 0.50 },
            { cap: 25000, rate: 0.75 },
            { cap: 50000, rate: 1.25 },
            { cap: 75000, rate: 1.75 },
            { cap: 100000, rate: 2.25 },
            { cap: 125000, rate: 2.75 },
            { cap: 150000, rate: 3.25 },
            { cap: 175000, rate: 3.75 },
            { cap: 200000, rate: 4.25 },
            { cap: 225000, rate: 4.75 },
            { cap: 250000, rate: 5.25 },
            { cap: 275000, rate: 5.75 },
            { cap: 300000, rate: 6.25 },
            { cap: 325000, rate: 6.75 },
            { cap: 350000, rate: 7.25 },
            { cap: 375000, rate: 7.75 },
            { cap: 400000, rate: 8.25 },
            { cap: 425000, rate: 8.75 },
            { cap: 450000, rate: 9.25 },
            // 截图外更高档位暂未知，先用最后一档兜底。
            { cap: Infinity, rate: 9.25 }
          ]
        },
        BTC: {
          // BTC 档位
          makerFeeRate: 0.02,
          takerFeeRate: 0.05,
          tiers: [
            { cap: 1000, rate: 0.40 },
            { cap: 5000, rate: 0.50 },
            { cap: 20000, rate: 0.75 },
            { cap: 40000, rate: 1.25 },
            { cap: 60000, rate: 1.75 },
            { cap: 80000, rate: 2.25 },
            { cap: 100000, rate: 2.75 },
            { cap: 120000, rate: 3.25 },
            { cap: 140000, rate: 3.75 },
            { cap: 160000, rate: 4.25 },
            { cap: 180000, rate: 4.75 },
            { cap: 200000, rate: 5.25 },
            { cap: 220000, rate: 5.75 },
            { cap: 240000, rate: 6.25 },
            { cap: 260000, rate: 6.75 },
            { cap: 280000, rate: 7.25 },
            { cap: 300000, rate: 7.75 },
            { cap: 320000, rate: 8.25 },
            { cap: 340000, rate: 8.75 },
            { cap: 360000, rate: 9.25 },
            // 截图外更高档位暂未知，先用最后一档兜底。
            { cap: Infinity, rate: 9.25 }
          ]
        }
      }
    },
    binance: {
      label: "Binance",
      symbols: {
        ETH: {
          // 先临时复用 OKX ETH，后续可替换成 Binance 真值
          makerFeeRate: 0.02,
          takerFeeRate: 0.05,
          tiers: [
            { cap: 5000, rate: 0.40 },
            { cap: 10000, rate: 0.50 },
            { cap: 25000, rate: 0.75 },
            { cap: 50000, rate: 1.25 },
            { cap: 75000, rate: 1.75 },
            { cap: 100000, rate: 2.25 },
            { cap: 125000, rate: 2.75 },
            { cap: 150000, rate: 3.25 },
            { cap: 175000, rate: 3.75 },
            { cap: Infinity, rate: 4.25 }
          ]
        }
      }
    },
    gate: {
      label: "Gate",
      symbols: {
        ETH: {
          // 先临时复用 OKX ETH，后续可替换成 Gate 真值
          makerFeeRate: 0.02,
          takerFeeRate: 0.05,
          tiers: [
            { cap: 5000, rate: 0.40 },
            { cap: 10000, rate: 0.50 },
            { cap: 25000, rate: 0.75 },
            { cap: 50000, rate: 1.25 },
            { cap: 75000, rate: 1.75 },
            { cap: 100000, rate: 2.25 },
            { cap: 125000, rate: 2.75 },
            { cap: 150000, rate: 3.25 },
            { cap: 175000, rate: 3.75 },
            { cap: Infinity, rate: 4.25 }
          ]
        }
      }
    }
  };
})();
