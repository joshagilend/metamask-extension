import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button } from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromToken,
  getToAmount,
  getToChain,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitBridgeTransaction } from '../../../ducks/bridge/actions';

export const BridgeCTAButton = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const toAmount = useSelector(getToAmount);

  const { isLoading } = useSelector(getBridgeQuotes);

  const isTxSubmittable =
    fromToken && toToken && fromChain && toChain && fromAmount && toAmount;

  const label = useMemo(() => {
    if (isLoading && !isTxSubmittable) {
      return t('swapFetchingQuotes');
    }

    if (!fromAmount) {
      if (!toToken) {
        return t('bridgeSelectTokenAndAmount');
      }
      return t('bridgeEnterAmount');
    }

    if (isTxSubmittable) {
      return t('confirm');
    }

    return t('swapSelectToken');
  }, [isLoading, fromAmount, toToken, isTxSubmittable]);

  return (
    <Button
      data-testid="bridge-cta-button"
      onClick={() => {
        if (isTxSubmittable) {
          // dispatch tx submission
          console.log('bridge CTA button clicked');
          dispatch(submitBridgeTransaction(history));
        }
      }}
      disabled={!isTxSubmittable}
    >
      {label}
    </Button>
  );
};
