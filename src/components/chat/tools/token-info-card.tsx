import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TokenInfoCardProps {
  tokenInfo: any; // TODO: fix this
}

export function TokenInfoCard({ tokenInfo }: TokenInfoCardProps) {
  return (
    <Card className="mb-4 bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium dark:text-white">
          Token Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-white">Token</dt>
            <dd className="font-medium dark:text-white">
              {tokenInfo.underlyingSymbol}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-white">Market Name</dt>
            <dd className="font-medium dark:text-white">
              {tokenInfo.cTokenName}
            </dd>
          </div>
          <div className="pt-2 space-y-1">
            <dt className="text-gray-500 dark:text-white">Addresses</dt>
            <dd className="font-mono text-xs break-all dark:text-white">
              <div>
                <span className="text-gray-500 dark:text-white">Token:</span>{" "}
                {tokenInfo.underlyingAddress}
              </div>
              <div>
                <span className="text-gray-500 dark:text-white">Market:</span>{" "}
                {tokenInfo.cTokenAddress}
              </div>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
