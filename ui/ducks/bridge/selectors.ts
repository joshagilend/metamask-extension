import {
  NetworkConfiguration,
  NetworkState,
} from '@metamask/network-controller';
import { orderBy, uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import {
  getNetworkConfigurationsByChainId,
  getIsBridgeEnabled,
  getSwapsDefaultToken,
  SwapsEthToken,
} from '../../selectors/selectors';
import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  BRIDGE_PREFERRED_GAS_ESTIMATE,
  BRIDGE_QUOTE_MAX_ETA_SECONDS as MAX_ETA_SECONDS,
  BRIDGE_QUOTE_MAXRETURN_VALUE_DIFFERENCE_PERCENTAGE as MAX_RETURN_VALUE_DIFF_PERCENTAGE,
} from '../../../shared/constants/bridge';
import {
  BridgeControllerState,
  BridgeFeatureFlagsKey,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import { createDeepEqualSelector } from '../../selectors/util';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { getGasFeeEstimates, getProviderConfig } from '../metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { RequestStatus } from '../../../app/scripts/controllers/bridge/constants';
import {
  QuoteMetadata,
  QuoteResponse,
  SortOrder,
} from '../../pages/bridge/types';
import {
  calcAdjustedReturn,
  calcCost,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcTotalNetworkFee,
} from '../../pages/bridge/utils/quote';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { BridgeState } from './bridge';

type BridgeAppState = {
  metamask: NetworkState & { bridgeState: BridgeControllerState } & {
    useExternalServices: boolean;
  };
  bridge: BridgeState;
};

// only includes networks user has added
export const getAllBridgeableNetworks = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  (networkConfigurationsByChainId) => {
    return uniqBy(
      Object.values(networkConfigurationsByChainId),
      'chainId',
    ).filter(({ chainId }) =>
      ALLOWED_BRIDGE_CHAIN_IDS.includes(
        chainId as (typeof ALLOWED_BRIDGE_CHAIN_IDS)[number],
      ),
    );
  },
);

export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (allBridgeableNetworks, bridgeFeatureFlags) =>
    allBridgeableNetworks.filter(({ chainId }) =>
      bridgeFeatureFlags[BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST].includes(
        chainId,
      ),
    ),
);

export const getFromChain = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getProviderConfig,
  (
    networkConfigurationsByChainId,
    providerConfig,
  ): NetworkConfiguration | undefined =>
    providerConfig?.chainId
      ? networkConfigurationsByChainId[providerConfig.chainId]
      : undefined,
);

export const getToChains = createDeepEqualSelector(
  getFromChain,
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (
    fromChain,
    allBridgeableNetworks,
    bridgeFeatureFlags,
  ): NetworkConfiguration[] =>
    allBridgeableNetworks.filter(
      ({ chainId }) =>
        fromChain?.chainId &&
        chainId !== fromChain.chainId &&
        bridgeFeatureFlags[
          BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST
        ].includes(chainId),
    ),
);

export const getToChain = createDeepEqualSelector(
  getToChains,
  (state: BridgeAppState) => state.bridge.toChainId,
  (toChains, toChainId): NetworkConfiguration | undefined =>
    toChains.find(({ chainId }) => chainId === toChainId),
);

export const getFromTokens = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTokens ?? {};
};

export const getFromTopAssets = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTopAssets ?? [];
};

export const getToTopAssets = (state: BridgeAppState) => {
  return state.bridge.toChainId ? state.metamask.bridgeState.destTopAssets : [];
};

export const getToTokens = (state: BridgeAppState) => {
  return state.bridge.toChainId ? state.metamask.bridgeState.destTokens : {};
};

export const getFromToken = (
  state: BridgeAppState,
): SwapsTokenObject | SwapsEthToken | null => {
  return state.bridge.fromToken?.address
    ? state.bridge.fromToken
    : getSwapsDefaultToken(state);
};

export const getToToken = (
  state: BridgeAppState,
): SwapsTokenObject | SwapsEthToken | null => {
  return state.bridge.toToken;
};

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask.bridgeState;
  return quoteRequest;
};

export const getBridgeQuotesConfig = (state: BridgeAppState) =>
  state.metamask.bridgeState?.bridgeFeatureFlags[
    BridgeFeatureFlagsKey.EXTENSION_CONFIG
  ] ?? {};

const _getBridgeFeesPerGas = createSelector(
  getGasFeeEstimates,
  (gasFeeEstimates) => ({
    estimatedBaseFeeInDecGwei: (gasFeeEstimates as GasFeeEstimates)
      ?.estimatedBaseFee,
    maxPriorityFeePerGasInDecGwei: (gasFeeEstimates as GasFeeEstimates)?.[
      BRIDGE_PREFERRED_GAS_ESTIMATE
    ]?.suggestedMaxPriorityFeePerGas,
    maxFeePerGas: decGWEIToHexWEI(
      (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxFeePerGas,
    ),
    maxPriorityFeePerGas: decGWEIToHexWEI(
      (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxPriorityFeePerGas,
    ),
  }),
);

export const getBridgeSortOrder = (state: BridgeAppState) =>
  state.bridge.sortOrder;

const _getQuotesWithMetadata = createDeepEqualSelector(
  (state) => state.metamask.bridgeState.quotes,
  (state: BridgeAppState) => state.bridge.toTokenExchangeRate,
  (state: BridgeAppState) => state.bridge.toNativeExchangeRate,
  (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
  (state: BridgeAppState) => state.bridge.fromNativeExchangeRate,
  _getBridgeFeesPerGas,
  (
    quotes,
    toTokenExchangeRate,
    toNativeExchangeRate,
    fromTokenExchangeRate,
    fromNativeExchangeRate,
    { estimatedBaseFeeInDecGwei, maxPriorityFeePerGasInDecGwei },
  ): (QuoteResponse & QuoteMetadata)[] => {
    return quotes.map((quote: QuoteResponse) => {
      const toTokenAmount = calcToAmount(
        quote.quote,
        toTokenExchangeRate,
        toNativeExchangeRate,
      );
      const totalNetworkFee = calcTotalNetworkFee(
        quote,
        estimatedBaseFeeInDecGwei,
        maxPriorityFeePerGasInDecGwei,
        fromNativeExchangeRate || undefined,
      );
      const sentAmount = calcSentAmount(
        quote.quote,
        fromTokenExchangeRate,
        fromNativeExchangeRate,
      );
      const adjustedReturn = calcAdjustedReturn(
        toTokenAmount.fiat,
        totalNetworkFee.fiat,
      );

      return {
        ...quote,
        toTokenAmount,
        sentAmount,
        totalNetworkFee,
        adjustedReturn,
        swapRate: calcSwapRate(sentAmount.raw, toTokenAmount.raw),
        cost: calcCost(adjustedReturn.fiat, sentAmount.fiat),
      };
    });
  },
);

const _getSortedQuotesWithMetadata = createDeepEqualSelector(
  _getQuotesWithMetadata,
  getBridgeSortOrder,
  (quotesWithMetadata, sortOrder) => {
    switch (sortOrder) {
      case SortOrder.ETA_ASC:
        return orderBy(
          quotesWithMetadata,
          (quote) => quote.estimatedProcessingTimeInSeconds,
          'asc',
        );
      case SortOrder.ADJUSTED_RETURN_DESC:
      default:
        return orderBy(
          quotesWithMetadata,
          ({ adjustedReturn }) => adjustedReturn.fiat,
          'desc',
        );
    }
  },
);

const _getRecommendedQuote = createDeepEqualSelector(
  _getSortedQuotesWithMetadata,
  getBridgeSortOrder,
  (sortedQuotesWithMetadata, sortOrder) => {
    if (!sortedQuotesWithMetadata.length) {
      return undefined;
    }

    const bestReturnValue = BigNumber.max(
      sortedQuotesWithMetadata.map(
        ({ adjustedReturn }) => adjustedReturn.fiat ?? 0,
      ),
    );

    const isFastestQuoteValueReasonable = (
      adjustedReturnInFiat: BigNumber | null,
    ) =>
      adjustedReturnInFiat
        ? adjustedReturnInFiat
            .div(bestReturnValue)
            .gte(MAX_RETURN_VALUE_DIFF_PERCENTAGE)
        : true;

    const isBestPricedQuoteETAReasonable = (
      estimatedProcessingTimeInSeconds: number,
    ) => estimatedProcessingTimeInSeconds < MAX_ETA_SECONDS;

    return (
      sortedQuotesWithMetadata.find((quote) => {
        return sortOrder === SortOrder.ETA_ASC
          ? isFastestQuoteValueReasonable(quote.adjustedReturn.fiat)
          : isBestPricedQuoteETAReasonable(
              quote.estimatedProcessingTimeInSeconds,
            );
      }) ?? sortedQuotesWithMetadata[0]
    );
  },
);

export const getBridgeQuotes = createSelector(
  _getSortedQuotesWithMetadata,
  _getRecommendedQuote,
  (state) => state.metamask.bridgeState.quotesLastFetched,
  (state) =>
    state.metamask.bridgeState.quotesLoadingStatus === RequestStatus.LOADING,
  (state: BridgeAppState) => state.metamask.bridgeState.quotesRefreshCount,
  getBridgeQuotesConfig,
  getQuoteRequest,
  (
    sortedQuotesWithMetadata,
    recommendedQuote,
    quotesLastFetchedMs,
    isLoading,
    quotesRefreshCount,
    { maxRefreshCount },
    { insufficientBal },
  ) => ({
    sortedQuotes: sortedQuotesWithMetadata,
    recommendedQuote,
    activeQuote: recommendedQuote,
    quotesLastFetchedMs,
    isLoading,
    quotesRefreshCount,
    isQuoteGoingToRefresh: insufficientBal
      ? false
      : quotesRefreshCount < maxRefreshCount,
  }),
);

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (state: BridgeAppState) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled && toChain && fromChain?.chainId
      ? fromChain.chainId !== toChain.chainId
      : false,
);
