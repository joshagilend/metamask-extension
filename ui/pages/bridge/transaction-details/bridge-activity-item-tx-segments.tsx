import React from 'react';
import {
  BridgeHistoryItem,
  StatusTypes,
} from '../../../../app/scripts/controllers/bridge-status/types';
import { UseBridgeDataProps } from '../utils/useBridgeData';
import { Box, Text } from '../../../components/component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import Segment from './segment';

const getTxIndex = (
  srcTxStatus: StatusTypes,
  destTxStatus: StatusTypes | null,
) => {
  if (srcTxStatus === StatusTypes.PENDING) {
    return 1;
  }

  if (srcTxStatus === StatusTypes.COMPLETE) {
    return 2;
  }

  throw new Error('No more possible states for srcTxStatus');
};

const getSrcTxStatus = (initialTransaction: TransactionMeta) => {
  return initialTransaction.status === TransactionStatus.confirmed
    ? StatusTypes.COMPLETE
    : StatusTypes.PENDING;
};

const getDestTxStatus = (
  bridgeTxHistoryItem: BridgeHistoryItem,
  srcTxStatus: StatusTypes,
) => {
  if (srcTxStatus !== StatusTypes.COMPLETE) {
    return null;
  }

  return bridgeTxHistoryItem?.status.destChain?.txHash &&
    bridgeTxHistoryItem.status.status === StatusTypes.COMPLETE
    ? StatusTypes.COMPLETE
    : StatusTypes.PENDING;
};

export default function BridgeActivityItemTxSegments({
  bridgeTxHistoryItem,
  transactionGroup,
}: {
  bridgeTxHistoryItem: BridgeHistoryItem;
  transactionGroup: UseBridgeDataProps['transactionGroup'];
}) {
  const { initialTransaction } = transactionGroup;
  const srcTxStatus = getSrcTxStatus(initialTransaction);
  const destTxStatus = getDestTxStatus(bridgeTxHistoryItem, srcTxStatus);
  const txIndex = getTxIndex(srcTxStatus, destTxStatus);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <Text color={TextColor.textAlternative}>Transaction {txIndex} of 2</Text>
      <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
        <Segment type={srcTxStatus} width={BlockSize.Half} />
        <Segment type={destTxStatus} width={BlockSize.Half} />
      </Box>
    </Box>
  );
}
