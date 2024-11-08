import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getDetectedTokensInCurrentNetwork,
  getAllDetectedTokensForSelectedAddress,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { BannerAlert } from '../../component-library';

export const DetectedTokensBanner = ({
  className,
  actionButtonOnClick,
  ...props
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);

  const detectedTokensMultichain = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );

  const detectedTokensDetails = process.env.PORTFOLIO_VIEW
    ? Object.values(detectedTokensMultichain)
        .flat()
        .map(({ address, symbol }) => `${symbol} - ${address}`)
    : detectedTokens.map(({ address, symbol }) => `${symbol} - ${address}`);

  const chainId = useSelector(getCurrentChainId);

  const totalTokens = process.env.PORTFOLIO_VIEW
    ? Object.values(detectedTokensMultichain).reduce(
        (count, tokenArray) => count + tokenArray.length,
        0,
      )
    : detectedTokens.length;

  const handleOnClick = () => {
    actionButtonOnClick();
    trackEvent({
      event: MetaMetricsEventName.TokenImportClicked,
      category: MetaMetricsEventCategory.Wallet,
      properties: {
        source_connection_method: MetaMetricsTokenEventSource.Detected,
        tokens: detectedTokensDetails,
        chain_id: chainId,
      },
    });
  };
  return (
    <BannerAlert
      className={classNames('multichain-detected-token-banner', className)}
      actionButtonLabel={t('importTokensCamelCase')}
      actionButtonOnClick={handleOnClick}
      data-testid="detected-token-banner"
      {...props}
    >
      {totalTokens === 1
        ? t('numberOfNewTokensDetectedSingular')
        : t('numberOfNewTokensDetectedPlural', [totalTokens])}
    </BannerAlert>
  );
};

DetectedTokensBanner.propTypes = {
  /**
   * Handler to be passed to the DetectedTokenBanner component
   */
  actionButtonOnClick: PropTypes.func.isRequired,
  /**
   * An additional className to the DetectedTokenBanner component
   */
  className: PropTypes.string,
};
