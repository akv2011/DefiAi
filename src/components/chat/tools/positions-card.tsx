import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Chain } from "@/lib/chains";

export interface Asset {
  asset: string;
  supplyBalance: string;
  supplyBalanceUsd: number;
  borrowBalance: string;
  borrowBalanceUsd: number;
}

export interface Pool {
  name: string;
  poolId: string;
  assets: Asset[];
  healthFactor: string;
}

export interface ProtocolPosition {
  protocol: "Ionic" | "Morpho";
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  netValueUsd: number;
  pools: Pool[];
}

export interface ChainPositions {
  chain: Chain;
  totalValueUsd: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  protocols: ProtocolPosition[];
}

export interface PositionsResponse {
  totalValueUsd: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  chains: ChainPositions[];
}

interface PositionsCardProps {
  data: PositionsResponse;
}

export function PositionsCard({ data }: PositionsCardProps) {
  const formatUsd = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatHealthFactor = (healthFactor: string) => {
    const value = Number(healthFactor);
    return value.toFixed(2);
  };

  const ChainCard = ({ chainData }: { chainData: ChainPositions }) => (
    <Card className="bg-gray-50 border-gray-200 dark:bg-black dark:border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
              {chainData.chain} Positions
            </CardTitle>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Net Value: {formatUsd(chainData.totalValueUsd)}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-emerald-600 dark:text-emerald-400">
              Supply: {formatUsd(chainData.totalSupplyUsd)}
            </div>
            <div className="text-red-600 dark:text-red-400">
              Borrow: {formatUsd(chainData.totalBorrowUsd)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {chainData.protocols.map(protocol => (
          <div key={protocol.protocol}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {protocol.protocol}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Net: {formatUsd(protocol.netValueUsd)}
                </span>
              </div>
              <div className="text-right text-xs">
                <div className="text-emerald-600 dark:text-emerald-400">
                  Supply: {formatUsd(protocol.totalSupplyUsd)}
                </div>
                <div className="text-red-600 dark:text-red-400">
                  Borrow: {formatUsd(protocol.totalBorrowUsd)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {protocol.pools
                .filter(pool => pool.assets.length > 0)
                .map(pool => (
                  <div key={pool.poolId}>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {pool.name}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        Health Factor: {formatHealthFactor(pool.healthFactor)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {pool.assets
                        .filter(
                          asset =>
                            Number(asset.supplyBalance) > 0 ||
                            Number(asset.borrowBalance) > 0
                        )
                        .map(asset => (
                          <div
                            key={asset.asset}
                            className="bg-white dark:bg-black rounded-lg p-3 border border-gray-100 dark:border-gray-800"
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {asset.asset}
                              </div>
                              <div className="text-right text-sm">
                                {Number(asset.supplyBalance) > 0 && (
                                  <div className="text-emerald-600 dark:text-emerald-400">
                                    Supply: {formatUsd(asset.supplyBalanceUsd)}
                                  </div>
                                )}
                                {Number(asset.borrowBalance) > 0 && (
                                  <div className="text-red-600 dark:text-red-400">
                                    Borrow: {formatUsd(asset.borrowBalanceUsd)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card className="bg-gray-50 border-gray-200 dark:bg-black dark:border-gray-800 mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Total Portfolio Value
          </CardTitle>
          <div className="flex justify-between items-center">
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {formatUsd(data.totalValueUsd)}
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Total Supply: {formatUsd(data.totalSupplyUsd)}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                Total Borrow: {formatUsd(data.totalBorrowUsd)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      {data.chains.map(chainData => (
        <ChainCard key={chainData.chain} chainData={chainData} />
      ))}
    </div>
  );
}
