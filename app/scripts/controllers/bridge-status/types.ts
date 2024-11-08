import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { BridgeHistoryItem } from '../../../../shared/types/bridge-status';
import { BRIDGE_STATUS_CONTROLLER_NAME } from './constants';
import BridgeStatusController from './bridge-status-controller';

// All fields need to be types not interfaces, same with their children fields
// o/w you get a type error
type SourceChainTxHash = string;
export type BridgeStatusControllerState = {
  txHistory: Record<SourceChainTxHash, BridgeHistoryItem>;
};

export enum BridgeStatusAction {
  START_POLLING_FOR_BRIDGE_TX_STATUS = 'startPollingForBridgeTxStatus',
  WIPE_BRIDGE_STATUS = 'wipeBridgeStatus',
  GET_STATE = 'getState',
}

type BridgeStatusControllerAction<
  FunctionName extends keyof BridgeStatusController,
> = {
  type: `${typeof BRIDGE_STATUS_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeStatusController[FunctionName];
};

// Maps to BridgeController function names
type BridgeStatusControllerActions =
  | BridgeStatusControllerAction<BridgeStatusAction.START_POLLING_FOR_BRIDGE_TX_STATUS>
  | BridgeStatusControllerAction<BridgeStatusAction.WIPE_BRIDGE_STATUS>
  | ControllerGetStateAction<
      typeof BRIDGE_STATUS_CONTROLLER_NAME,
      BridgeStatusControllerState
    >;

type BridgeStatusControllerEvents = ControllerStateChangeEvent<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerState
>;

type AllowedActions =
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | AccountsControllerGetSelectedAccountAction;
type AllowedEvents = never;

/**
 * The messenger for the BridgeStatusController.
 */
export type BridgeStatusControllerMessenger = RestrictedControllerMessenger<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerActions | AllowedActions,
  BridgeStatusControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;
