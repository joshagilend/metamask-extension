import { StateMetadata } from '@metamask/base-controller';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import { QuoteResponse } from '../../../../ui/pages/bridge/types';
import {
  BRIDGE_STATUS_CONTROLLER_NAME,
  DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
  REFRESH_INTERVAL_MS,
} from './constants';
import {
  BridgeStatusControllerState,
  BridgeStatusControllerMessenger,
  StatusRequest,
  StatusTypes,
  BridgeHistoryItem,
} from './types';
import { fetchBridgeTxStatus } from './utils';

const metadata: StateMetadata<{
  bridgeStatusState: BridgeStatusControllerState;
}> = {
  bridgeStatusState: {
    persist: false, // TODO should we persist this? TxController does, but StxController does not
    anonymous: false,
  },
};

type TxHash = string;
export type FetchBridgeTxStatusArgs = {
  statusRequest: StatusRequest;
  quoteResponse: QuoteResponse;
  startTime?: BridgeHistoryItem['startTime'];
  slippagePercentage: BridgeHistoryItem['slippagePercentage'];
  completionTime?: BridgeHistoryItem['completionTime'];
  pricingData?: BridgeHistoryItem['pricingData'];
  initialDestAssetBalance?: BridgeHistoryItem['initialDestAssetBalance'];
  targetContractAddress?: BridgeHistoryItem['targetContractAddress'];
};

export default class BridgeStatusController extends StaticIntervalPollingController<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  { bridgeStatusState: BridgeStatusControllerState },
  BridgeStatusControllerMessenger
> {
  #pollingTokensByTxHash: Record<TxHash, string> = {};

  constructor({ messenger }: { messenger: BridgeStatusControllerMessenger }) {
    super({
      name: BRIDGE_STATUS_CONTROLLER_NAME,
      metadata,
      messenger,
      state: { bridgeStatusState: DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE },
    });

    // Register action handlers
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_STATUS_CONTROLLER_NAME}:startPollingForBridgeTxStatus`,
      this.startPollingForBridgeTxStatus.bind(this),
    );

    // Set interval
    this.setIntervalLength(REFRESH_INTERVAL_MS);
  }

  resetState = () => {
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
      };
    });
  };

  startPollingForBridgeTxStatus = async (
    fetchBridgeTxStatusArgs: FetchBridgeTxStatusArgs,
  ) => {
    const { statusRequest } = fetchBridgeTxStatusArgs;

    const hexSourceChainId = new Numeric(statusRequest.srcChainId, 10)
      .toPrefixedHexString()
      .toLowerCase() as `0x${string}`;

    const networkClientId = this.messagingSystem.call(
      'NetworkController:findNetworkClientIdByChainId',
      hexSourceChainId,
    );
    this.#pollingTokensByTxHash[statusRequest.srcTxHash] =
      this.startPollingByNetworkClientId(
        networkClientId,
        fetchBridgeTxStatusArgs,
      );
  };

  // This will be called after you call this.startPollingByNetworkClientId()
  _executePoll = async (
    _networkClientId: string,
    fetchBridgeTxStatusArgs: FetchBridgeTxStatusArgs,
  ) => {
    await this.#fetchBridgeTxStatus(fetchBridgeTxStatusArgs);
  };

  #getSelectedAccount() {
    return this.messagingSystem.call('AccountsController:getSelectedAccount');
  }

  #fetchBridgeTxStatus = async ({
    statusRequest,
    quoteResponse,
    startTime,
    slippagePercentage,
    completionTime,
    pricingData,
    initialDestAssetBalance,
    targetContractAddress,
  }: FetchBridgeTxStatusArgs) => {
    const { bridgeStatusState } = this.state;
    const { address: account } = this.#getSelectedAccount();

    const commonFields = {
      quote: quoteResponse.quote,
      startTime,
      estimatedProcessingTimeInSeconds:
        quoteResponse.estimatedProcessingTimeInSeconds,
      slippagePercentage,
      completionTime,
      pricingData,
      initialDestAssetBalance,
      targetContractAddress,
      account,
    };

    // Write all non-status fields to state so we can reference the quote in Activity list
    // We know it's in progress but not the exact status without talking to Bridge API
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...bridgeStatusState,
        txHistory: {
          ...bridgeStatusState.txHistory,
          [statusRequest.srcTxHash]: {
            ...commonFields,
          },
        },
      };
    });
    try {
      // We try here because we receive 500 errors from Bridge API if we try to fetch immediately after submitting the source tx
      // Oddly mostly happens on Optimism, never on Arbitrum. By the 2nd fetch, the Bridge API responds properly.
      const status = await fetchBridgeTxStatus(statusRequest);
      console.log('fetchBridgeTxStatus', {
        statusRequest,
        status,
      });

      // No need to purge these on network change or account change, TransactionController does not purge either.
      // TODO In theory we can skip checking status if it's not the current account/network
      // we need to keep track of the account that this is associated with as well so that we don't show it in Activity list for other accounts
      // First stab at this will not stop polling when you are on a different account

      this.update((_state) => {
        _state.bridgeStatusState = {
          ...bridgeStatusState,
          txHistory: {
            ...bridgeStatusState.txHistory,
            [statusRequest.srcTxHash]: {
              ...commonFields,
              status,
            },
          },
        };
      });

      const pollingToken = this.#pollingTokensByTxHash[statusRequest.srcTxHash];
      if (status.status === StatusTypes.COMPLETE && pollingToken) {
        this.stopPollingByPollingToken(pollingToken);
      }
    } catch (e) {
      console.error(e);
    }
  };
}
