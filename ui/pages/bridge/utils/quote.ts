import { zeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { QuoteResponse, QuoteRequest, Quote } from '../types';
import {
  hexToDecimal,
  sumDecimals,
} from '../../../../shared/modules/conversion.utils';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';

export const isValidQuoteRequest = (
  partialRequest: Partial<QuoteRequest>,
  requireAmount = true,
): partialRequest is QuoteRequest => {
  const STRING_FIELDS = ['srcTokenAddress', 'destTokenAddress'];
  if (requireAmount) {
    STRING_FIELDS.push('srcTokenAmount');
  }
  const NUMBER_FIELDS = ['srcChainId', 'destChainId', 'slippage'];

  return (
    STRING_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'string' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        partialRequest[field as keyof typeof partialRequest] !== '' &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    NUMBER_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'number' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        !isNaN(Number(partialRequest[field as keyof typeof partialRequest])) &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    (requireAmount
      ? Boolean((partialRequest.srcTokenAmount ?? '').match(/^[1-9]\d*$/u))
      : true)
  );
};

export const calcToAmount = (
  { destTokenAmount, destAsset }: Quote,
  toTokenExchangeRate: number | null,
  toNativeExchangeRate: number | null,
) => {
  const normalizedDestAmount = calcTokenAmount(
    destTokenAmount,
    destAsset.decimals,
  );
  return {
    raw: normalizedDestAmount,
    fiat:
      toTokenExchangeRate && toNativeExchangeRate
        ? normalizedDestAmount.mul(
            destAsset.address === zeroAddress()
              ? toNativeExchangeRate.toString()
              : toTokenExchangeRate.toString(),
          )
        : null,
  };
};

export const calcSentAmount = (
  { srcTokenAmount, srcAsset, feeData }: Quote,
  fromTokenExchangeRate: number | null,
  fromNativeExchangeRate: number | null,
) => {
  const normalizedSentAmount = calcTokenAmount(
    new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount),
    srcAsset.decimals,
  );
  const tokenExchangeRate =
    srcAsset.address === zeroAddress()
      ? fromNativeExchangeRate
      : fromTokenExchangeRate;
  return {
    raw: normalizedSentAmount,
    fiat: tokenExchangeRate
      ? normalizedSentAmount.mul(tokenExchangeRate.toString())
      : null,
  };
};

const calcRelayerFee = (
  bridgeQuote: QuoteResponse,
  fromNativeExchangeRate?: number,
) => {
  const {
    quote: { srcAsset, srcTokenAmount, feeData },
    trade,
  } = bridgeQuote;
  const relayerFeeInNative = calcTokenAmount(
    new BigNumber(hexToDecimal(trade.value)).minus(
      srcAsset.address === zeroAddress()
        ? new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount)
        : 0,
    ),
    18,
  );
  return {
    raw: relayerFeeInNative,
    fiat: fromNativeExchangeRate
      ? relayerFeeInNative.mul(fromNativeExchangeRate)
      : null,
  };
};

const calcTotalGasFee = (
  bridgeQuote: QuoteResponse,
  estimatedBaseFeeInDecGwei: string,
  maxPriorityFeePerGasInDecGwei: string,
  fromNativeExchangeRate?: number,
  l1GasInDecGwei?: BigNumber,
) => {
  const { approval, trade } = bridgeQuote;
  const totalGasLimitInDec = sumDecimals(
    trade.gasLimit?.toString() ?? '0',
    approval?.gasLimit?.toString() ?? '0',
  );
  const feePerGasInDecGwei = sumDecimals(
    estimatedBaseFeeInDecGwei,
    maxPriorityFeePerGasInDecGwei,
  );
  const gasFeesInDecGwei = totalGasLimitInDec.times(feePerGasInDecGwei);

  if (l1GasInDecGwei) {
    gasFeesInDecGwei.add(l1GasInDecGwei);
  }

  const gasFeesInDecEth = new BigNumber(
    gasFeesInDecGwei.shiftedBy(9).toString(),
  );
  const gasFeesInUSD = fromNativeExchangeRate
    ? gasFeesInDecEth.times(fromNativeExchangeRate)
    : null;

  return {
    raw: gasFeesInDecEth,
    fiat: gasFeesInUSD,
  };
};

export const calcTotalNetworkFee = (
  bridgeQuote: QuoteResponse,
  estimatedBaseFeeInDecGwei: string,
  maxPriorityFeePerGasInDecGwei: string,
  fromNativeExchangeRate?: number,
) => {
  const normalizedGasFee = calcTotalGasFee(
    bridgeQuote,
    estimatedBaseFeeInDecGwei,
    maxPriorityFeePerGasInDecGwei,
    fromNativeExchangeRate,
  );
  const normalizedRelayerFee = calcRelayerFee(
    bridgeQuote,
    fromNativeExchangeRate,
  );
  return {
    raw: normalizedGasFee.raw.plus(normalizedRelayerFee.raw),
    fiat: normalizedGasFee.fiat?.plus(normalizedRelayerFee.fiat || '0') ?? null,
  };
};

export const calcAdjustedReturn = (
  destTokenAmountInFiat: BigNumber | null,
  totalNetworkFeeInFiat: BigNumber | null,
) => ({
  fiat:
    destTokenAmountInFiat && totalNetworkFeeInFiat
      ? destTokenAmountInFiat.minus(totalNetworkFeeInFiat)
      : null,
});

export const calcSwapRate = (
  sentAmount: BigNumber,
  destTokenAmount: BigNumber,
) => destTokenAmount.div(sentAmount);

export const calcCost = (
  adjustedReturnInFiat: BigNumber | null,
  sentAmountInFiat: BigNumber | null,
) => ({
  fiat:
    adjustedReturnInFiat && sentAmountInFiat
      ? adjustedReturnInFiat.minus(sentAmountInFiat)
      : null,
});

export const formatEtaInMinutes = (estimatedProcessingTimeInSeconds: number) =>
  (estimatedProcessingTimeInSeconds / 60).toFixed();

export const formatTokenAmount = (
  amount: BigNumber,
  symbol: string = '',
  precision: number = DEFAULT_PRECISION,
) => [amount.toFixed(precision), symbol].join(' ').trim();

export const formatFiatAmount = (
  amount: BigNumber | null,
  currency: string,
  precision?: number,
) =>
  amount ? formatCurrency(amount.toString(), currency, precision) : undefined;
