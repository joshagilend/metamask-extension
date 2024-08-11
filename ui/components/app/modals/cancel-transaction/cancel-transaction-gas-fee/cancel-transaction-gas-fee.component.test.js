import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import CancelTransactionGasFee from './cancel-transaction-gas-fee.component';

describe('CancelTransactionGasFee Component', () => {
  const defaultState = {
    metamask: {
      networkConfigurationsByChainId: {
        [CHAIN_IDS.GOERLI]: {
          chainId: CHAIN_IDS.GOERLI,
          rpcEndpoints: [{}],
        },
      },
      // providerConfig: {
      //   chainId: CHAIN_IDS.GOERLI,
      //   nickname: GOERLI_DISPLAY_NAME,
      //   type: NETWORK_TYPES.GOERLI,
      // },
      currencyRates: {},
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: false,
      },
      completedOnboarding: true,
      internalAccounts: mockState.metamask.internalAccounts,
    },
  };

  const mockStore = configureMockStore()(defaultState);

  it('should render', () => {
    const props = {
      value: '0x3b9aca00',
    };

    const { container } = renderWithProvider(
      <CancelTransactionGasFee {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
