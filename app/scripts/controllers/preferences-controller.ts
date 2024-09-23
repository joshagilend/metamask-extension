import {
  AccountsControllerChangeEvent,
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
  AccountsControllerState,
} from '@metamask/accounts-controller';
import { Hex } from '@metamask/utils';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  CHAIN_IDS,
  IPFS_DEFAULT_GATEWAY_URL,
} from '../../../shared/constants/network';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import { ThemeType } from '../../../shared/constants/preferences';

type AccountIdentityEntry = {
  address: string;
  name: string;
  lastSelected?: number;
};

const mainNetworks = {
  [CHAIN_IDS.MAINNET]: true,
  [CHAIN_IDS.LINEA_MAINNET]: true,
};

const testNetworks = {
  [CHAIN_IDS.GOERLI]: true,
  [CHAIN_IDS.SEPOLIA]: true,
  [CHAIN_IDS.LINEA_SEPOLIA]: true,
};

const controllerName = 'PreferencesController';

/**
 * Returns the state of the {@link PreferencesController}.
 */
export type PreferencesControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  PreferencesControllerState
>;

/**
 * Actions exposed by the {@link PreferencesController}.
 */
export type PreferencesControllerActions = PreferencesControllerGetStateAction;

/**
 * Event emitted when the state of the {@link PreferencesController} changes.
 */
export type PreferencesControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  PreferencesControllerState
>;

/**
 * Events emitted by {@link PreferencesController}.
 */
export type PreferencesControllerEvents = PreferencesControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerSetAccountNameAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetSelectedAccountAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = AccountsControllerChangeEvent;

export type PreferencesControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  PreferencesControllerActions | AllowedActions,
  PreferencesControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

type PreferencesControllerOptions = {
  networkConfigurationsByChainId?: Record<Hex, { chainId: Hex }>;
  state?: Partial<PreferencesControllerState>;
  initLangCode?: string;
  messenger: PreferencesControllerMessenger;
};

export type Preferences = {
  autoLockTimeLimit?: number;
  showExtensionInFullSizeView: boolean;
  showFiatInTestnets: boolean;
  showTestNetworks: boolean;
  smartTransactionsOptInStatus: boolean | null;
  useNativeCurrencyAsPrimaryCurrency: boolean;
  hideZeroBalanceTokens: boolean;
  petnamesEnabled: boolean;
  redesignedConfirmationsEnabled: boolean;
  redesignedTransactionsEnabled: boolean;
  featureNotificationsEnabled: boolean;
  showMultiRpcModal: boolean;
  isRedesignedConfirmationsDeveloperEnabled: boolean;
  showConfirmationAdvancedDetails: boolean;
};

export type PreferencesControllerState = {
  selectedAddress: string;
  useBlockie: boolean;
  useNonceField: boolean;
  usePhishDetect: boolean;
  dismissSeedBackUpReminder: boolean;
  useMultiAccountBalanceChecker: boolean;
  useSafeChainsListValidation: boolean;
  useTokenDetection: boolean;
  useNftDetection: boolean;
  use4ByteResolution: boolean;
  useCurrencyRateCheck: boolean;
  useRequestQueue: boolean;
  openSeaEnabled: boolean;
  securityAlertsEnabled: boolean;
  watchEthereumAccountEnabled: boolean;
  bitcoinSupportEnabled: boolean;
  bitcoinTestnetSupportEnabled: boolean;
  addSnapAccountEnabled: boolean;
  advancedGasFee: Record<string, Record<string, string>>;
  featureFlags: Record<string, boolean>;
  incomingTransactionsPreferences: Record<number, boolean>;
  knownMethodData: Record<string, string>;
  currentLocale: string;
  identities: Record<string, AccountIdentityEntry>;
  lostIdentities: Record<string, AccountIdentityEntry>;
  forgottenPassword: boolean;
  preferences: Preferences;
  ipfsGateway: string;
  isIpfsGatewayEnabled: boolean;
  useAddressBarEnsResolution: boolean;
  ledgerTransportType: LedgerTransportTypes;
  // TODO: replace never with proper type
  snapRegistryList: Record<string, never>;
  theme: ThemeType;
  snapsAddSnapAccountModalDismissed: boolean;
  useExternalNameSources: boolean;
  useTransactionSimulations: boolean;
  enableMV3TimestampSave: boolean;
  useExternalServices: boolean;
  textDirection?: string;
};

/**
 * Function to get default state of the {@link PreferencesController}.
 */
export const getDefaultPreferencesControllerState = () => ({
  selectedAddress: '',
  useBlockie: false,
  useNonceField: false,
  usePhishDetect: true,
  dismissSeedBackUpReminder: false,
  useMultiAccountBalanceChecker: true,
  useSafeChainsListValidation: true,
  // set to true means the dynamic list from the API is being used
  // set to false will be using the static list from contract-metadata
  useTokenDetection: true,
  useNftDetection: true,
  use4ByteResolution: true,
  useCurrencyRateCheck: true,
  useRequestQueue: true,
  openSeaEnabled: true,
  securityAlertsEnabled: true,
  watchEthereumAccountEnabled: false,
  bitcoinSupportEnabled: false,
  bitcoinTestnetSupportEnabled: false,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  addSnapAccountEnabled: false,
  ///: END:ONLY_INCLUDE_IF
  advancedGasFee: {},

  // WARNING: Do not use feature flags for security-sensitive things.
  // Feature flag toggling is available in the global namespace
  // for convenient testing of pre-release features, and should never
  // perform sensitive operations.
  featureFlags: {},
  incomingTransactionsPreferences: {
    ...mainNetworks,
    ...testNetworks,
  },
  knownMethodData: {},
  currentLocale: '',
  identities: {},
  lostIdentities: {},
  forgottenPassword: false,
  preferences: {
    autoLockTimeLimit: undefined,
    showExtensionInFullSizeView: false,
    showFiatInTestnets: false,
    showTestNetworks: false,
    smartTransactionsOptInStatus: null, // null means we will show the Smart Transactions opt-in modal to a user if they are eligible
    useNativeCurrencyAsPrimaryCurrency: true,
    hideZeroBalanceTokens: false,
    petnamesEnabled: true,
    redesignedConfirmationsEnabled: true,
    redesignedTransactionsEnabled: true,
    featureNotificationsEnabled: false,
    isRedesignedConfirmationsDeveloperEnabled: false,
    showConfirmationAdvancedDetails: false,
    showMultiRpcModal: false,
  },
  // ENS decentralized website resolution
  ipfsGateway: IPFS_DEFAULT_GATEWAY_URL,
  isIpfsGatewayEnabled: true,
  useAddressBarEnsResolution: true,
  // Ledger transport type is deprecated. We currently only support webhid
  // on chrome, and u2f on firefox.
  ledgerTransportType: window.navigator.hid
    ? LedgerTransportTypes.webhid
    : LedgerTransportTypes.u2f,
  snapRegistryList: {},
  theme: ThemeType.os,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  snapsAddSnapAccountModalDismissed: false,
  ///: END:ONLY_INCLUDE_IF
  useExternalNameSources: true,
  useTransactionSimulations: true,
  enableMV3TimestampSave: true,
  // Turning OFF basic functionality toggle means turning OFF this useExternalServices flag.
  // Whenever useExternalServices is false, certain features will be disabled.
  // The flag is true by Default, meaning the toggle is ON by default.
  useExternalServices: true,
});

/**
 * {@link PreferencesController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata = {
  selectedAddress: {
    persist: false,
    anonymous: false,
  },
  useBlockie: {
    persist: false,
    anonymous: false,
  },
  useNonceField: {
    persist: false,
    anonymous: false,
  },
  usePhishDetect: {
    persist: false,
    anonymous: false,
  },
  dismissSeedBackUpReminder: {
    persist: false,
    anonymous: false,
  },
  useMultiAccountBalanceChecker: {
    persist: false,
    anonymous: false,
  },
  useSafeChainsListValidation: {
    persist: false,
    anonymous: false,
  },
  useTokenDetection: {
    persist: false,
    anonymous: false,
  },
  useNftDetection: {
    persist: false,
    anonymous: false,
  },
  use4ByteResolution: {
    persist: false,
    anonymous: false,
  },
  useCurrencyRateCheck: {
    persist: false,
    anonymous: false,
  },
  useRequestQueue: {
    persist: false,
    anonymous: false,
  },
  openSeaEnabled: {
    persist: false,
    anonymous: false,
  },
  securityAlertsEnabled: {
    persist: false,
    anonymous: false,
  },
  watchEthereumAccountEnabled: {
    persist: false,
    anonymous: false,
  },
  bitcoinSupportEnabled: {
    persist: false,
    anonymous: false,
  },
  bitcoinTestnetSupportEnabled: {
    persist: false,
    anonymous: false,
  },
  addSnapAccountEnabled: {
    persist: false,
    anonymous: false,
  },
  advancedGasFee: {
    persist: false,
    anonymous: false,
  },
  featureFlags: {
    persist: false,
    anonymous: false,
  },
  incomingTransactionsPreferences: {
    persist: false,
    anonymous: false,
  },
  knownMethodData: {
    persist: false,
    anonymous: false,
  },
  currentLocale: {
    persist: false,
    anonymous: false,
  },
  identities: {
    persist: false,
    anonymous: false,
  },
  lostIdentities: {
    persist: true,
    anonymous: false,
  },
  forgottenPassword: {
    persist: false,
    anonymous: false,
  },
  preferences: {
    persist: false,
    anonymous: false,
  },
  ipfsGateway: {
    persist: false,
    anonymous: false,
  },
  isIpfsGatewayEnabled: {
    persist: false,
    anonymous: false,
  },
  useAddressBarEnsResolution: {
    persist: false,
    anonymous: false,
  },
  ledgerTransportType: {
    persist: false,
    anonymous: false,
  },
  snapRegistryList: {
    persist: false,
    anonymous: false,
  },
  theme: {
    persist: false,
    anonymous: false,
  },
  snapsAddSnapAccountModalDismissed: {
    persist: false,
    anonymous: false,
  },
  useExternalNameSources: {
    persist: false,
    anonymous: false,
  },
  useTransactionSimulations: {
    persist: false,
    anonymous: false,
  },
  enableMV3TimestampSave: {
    persist: false,
    anonymous: false,
  },
  useExternalServices: {
    persist: false,
    anonymous: false,
  },
  textDirection: {
    persist: false,
    anonymous: false,
  },
};

export default class PreferencesController extends BaseController<
  typeof controllerName,
  PreferencesControllerState,
  PreferencesControllerMessenger
> {
  /**
   * Constructs a Preferences controller.
   *
   * @param options - the controller options
   * @param options.networkConfigurationsByChainId - The network configurations
   * @param options.initLangCode - The language code
   * @param options.messenger - The controller messenger
   * @param options.state - The initial controller state
   */
  constructor({
    networkConfigurationsByChainId,
    initLangCode,
    messenger,
    state,
  }: PreferencesControllerOptions) {
    const addedNonMainNetwork: Record<Hex, boolean> = Object.values(
      networkConfigurationsByChainId ?? {},
    ).reduce((acc: Record<Hex, boolean>, element) => {
      acc[element.chainId] = true;
      return acc;
    }, {});
    super({
      messenger,
      metadata: controllerMetadata,
      name: controllerName,
      state: {
        ...getDefaultPreferencesControllerState(),
        ...state,
        incomingTransactionsPreferences: {
          ...mainNetworks,
          ...addedNonMainNetwork,
          ...testNetworks,
        },
        currentLocale: initLangCode ?? '',
      },
    });

    this.messagingSystem.subscribe(
      'AccountsController:stateChange',
      this.#handleAccountsControllerSync.bind(this),
    );

    globalThis.setPreference = (key: keyof Preferences, value: boolean) => {
      return this.setFeatureFlag(key, value);
    };
  }

  /**
   * Sets the {@code forgottenPassword} state property
   *
   * @param forgottenPassword - whether or not the user has forgotten their password
   */
  setPasswordForgotten(forgottenPassword: boolean): void {
    this.update((state) => {
      state.forgottenPassword = forgottenPassword;
    });
  }

  /**
   * Setter for the `useBlockie` property
   *
   * @param val - Whether or not the user prefers blockie indicators
   */
  setUseBlockie(val: boolean): void {
    this.update((state) => {
      state.useBlockie = val;
    });
  }

  /**
   * Setter for the `useNonceField` property
   *
   * @param val - Whether or not the user prefers to set nonce
   */
  setUseNonceField(val: boolean): void {
    this.update((state) => {
      state.useNonceField = val;
    });
  }

  /**
   * Setter for the `usePhishDetect` property
   *
   * @param val - Whether or not the user prefers phishing domain protection
   */
  setUsePhishDetect(val: boolean): void {
    this.update((state) => {
      state.usePhishDetect = val;
    });
  }

  /**
   * Setter for the `useMultiAccountBalanceChecker` property
   *
   * @param val - Whether or not the user prefers to turn off/on all security settings
   */
  setUseMultiAccountBalanceChecker(val: boolean): void {
    this.update((state) => {
      state.useMultiAccountBalanceChecker = val;
    });
  }

  /**
   * Setter for the `useSafeChainsListValidation` property
   *
   * @param val - Whether or not the user prefers to turn off/on validation for manually adding networks
   */
  setUseSafeChainsListValidation(val: boolean): void {
    this.update((state) => {
      state.useSafeChainsListValidation = val;
    });
  }

  toggleExternalServices(useExternalServices: boolean): void {
    this.update((state) => {
      state.useExternalServices = useExternalServices;
    });
    this.setUseTokenDetection(useExternalServices);
    this.setUseCurrencyRateCheck(useExternalServices);
    this.setUsePhishDetect(useExternalServices);
    this.setUseAddressBarEnsResolution(useExternalServices);
    this.setOpenSeaEnabled(useExternalServices);
    this.setUseNftDetection(useExternalServices);
  }

  /**
   * Setter for the `useTokenDetection` property
   *
   * @param val - Whether or not the user prefers to use the static token list or dynamic token list from the API
   */
  setUseTokenDetection(val: boolean): void {
    this.update((state) => {
      state.useTokenDetection = val;
    });
  }

  /**
   * Setter for the `useNftDetection` property
   *
   * @param useNftDetection - Whether or not the user prefers to autodetect NFTs.
   */
  setUseNftDetection(useNftDetection: boolean): void {
    this.update((state) => {
      state.useNftDetection = useNftDetection;
    });
  }

  /**
   * Setter for the `use4ByteResolution` property
   *
   * @param use4ByteResolution - (Privacy) Whether or not the user prefers to have smart contract name details resolved with 4byte.directory
   */
  setUse4ByteResolution(use4ByteResolution: boolean): void {
    this.update((state) => {
      state.use4ByteResolution = use4ByteResolution;
    });
  }

  /**
   * Setter for the `useCurrencyRateCheck` property
   *
   * @param val - Whether or not the user prefers to use currency rate check for ETH and tokens.
   */
  setUseCurrencyRateCheck(val: boolean): void {
    this.update((state) => {
      state.useCurrencyRateCheck = val;
    });
  }

  /**
   * Setter for the `useRequestQueue` property
   *
   * @param val - Whether or not the user wants to have requests queued if network change is required.
   */
  setUseRequestQueue(val: boolean): void {
    this.update((state) => {
      state.useRequestQueue = val;
    });
  }

  /**
   * Setter for the `openSeaEnabled` property
   *
   * @param openSeaEnabled - Whether or not the user prefers to use the OpenSea API for NFTs data.
   */
  setOpenSeaEnabled(openSeaEnabled: boolean): void {
    this.update((state) => {
      state.openSeaEnabled = openSeaEnabled;
    });
  }

  /**
   * Setter for the `securityAlertsEnabled` property
   *
   * @param securityAlertsEnabled - Whether or not the user prefers to use the security alerts.
   */
  setSecurityAlertsEnabled(securityAlertsEnabled: boolean): void {
    this.update((state) => {
      state.securityAlertsEnabled = securityAlertsEnabled;
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  /**
   * Setter for the `addSnapAccountEnabled` property.
   *
   * @param addSnapAccountEnabled - Whether or not the user wants to
   * enable the "Add Snap accounts" button.
   */
  setAddSnapAccountEnabled(addSnapAccountEnabled: boolean): void {
    this.update((state) => {
      state.addSnapAccountEnabled = addSnapAccountEnabled;
    });
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * Setter for the `watchEthereumAccountEnabled` property.
   *
   * @param watchEthereumAccountEnabled - Whether or not the user wants to
   * enable the "Watch Ethereum account (Beta)" button.
   */
  setWatchEthereumAccountEnabled(watchEthereumAccountEnabled: boolean): void {
    this.update((state) => {
      state.watchEthereumAccountEnabled = watchEthereumAccountEnabled;
    });
  }

  /**
   * Setter for the `bitcoinSupportEnabled` property.
   *
   * @param bitcoinSupportEnabled - Whether or not the user wants to
   * enable the "Add a new Bitcoin account (Beta)" button.
   */
  setBitcoinSupportEnabled(bitcoinSupportEnabled: boolean): void {
    this.update((state) => {
      state.bitcoinSupportEnabled = bitcoinSupportEnabled;
    });
  }

  /**
   * Setter for the `bitcoinTestnetSupportEnabled` property.
   *
   * @param bitcoinTestnetSupportEnabled - Whether or not the user wants to
   * enable the "Add a new Bitcoin account (Testnet)" button.
   */
  setBitcoinTestnetSupportEnabled(bitcoinTestnetSupportEnabled: boolean): void {
    this.update((state) => {
      state.bitcoinTestnetSupportEnabled = bitcoinTestnetSupportEnabled;
    });
  }

  /**
   * Setter for the `useExternalNameSources` property
   *
   * @param useExternalNameSources - Whether or not to use external name providers in the name controller.
   */
  setUseExternalNameSources(useExternalNameSources: boolean): void {
    this.update((state) => {
      state.useExternalNameSources = useExternalNameSources;
    });
  }

  /**
   * Setter for the `useTransactionSimulations` property
   *
   * @param useTransactionSimulations - Whether or not to use simulations in the transaction confirmations.
   */
  setUseTransactionSimulations(useTransactionSimulations: boolean): void {
    this.update((state) => {
      state.useTransactionSimulations = useTransactionSimulations;
    });
  }

  /**
   * Setter for the `advancedGasFee` property
   *
   * @param options
   * @param options.chainId - The chainId the advancedGasFees should be set on
   * @param options.gasFeePreferences - The advancedGasFee options to set
   */
  setAdvancedGasFee({
    chainId,
    gasFeePreferences,
  }: {
    chainId: string;
    gasFeePreferences: Record<string, string>;
  }): void {
    const { advancedGasFee } = this.state;
    this.update((state) => {
      state.advancedGasFee = {
        ...advancedGasFee,
        [chainId]: gasFeePreferences,
      };
    });
  }

  /**
   * Setter for the `theme` property
   *
   * @param val - 'default' or 'dark' value based on the mode selected by user.
   */
  setTheme(val: ThemeType): void {
    this.update((state) => {
      state.theme = val;
    });
  }

  /**
   * Add new methodData to state, to avoid requesting this information again through Infura
   *
   * @param fourBytePrefix - Four-byte method signature
   * @param methodData - Corresponding data method
   */
  addKnownMethodData(fourBytePrefix: string, methodData: string): void {
    const { knownMethodData } = this.state;

    const updatedKnownMethodData = { ...knownMethodData };
    updatedKnownMethodData[fourBytePrefix] = methodData;

    this.update((state) => {
      state.knownMethodData = updatedKnownMethodData;
    });
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param key - he preferred language locale key
   */
  setCurrentLocale(key: string): string {
    const textDirection = ['ar', 'dv', 'fa', 'he', 'ku'].includes(key)
      ? 'rtl'
      : 'auto';
    this.update((state) => {
      state.currentLocale = key;
      state.textDirection = textDirection;
    });
    return textDirection;
  }

  /**
   * Setter for the `selectedAddress` property
   *
   * @deprecated - Use setSelectedAccount from the AccountsController
   * @param address - A new hex address for an account
   */
  setSelectedAddress(address: string): void {
    const account = this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (!account) {
      throw new Error(`Identity for '${address} not found`);
    }

    this.messagingSystem.call(
      'AccountsController:setSelectedAccount',
      account.id,
    );
  }

  /**
   * Getter for the `selectedAddress` property
   *
   * @deprecated - Use the getSelectedAccount from the AccountsController
   * @returns The hex address for the currently selected account
   */
  getSelectedAddress(): string {
    const selectedAccount = this.messagingSystem.call(
      'AccountsController:getSelectedAccount',
    );

    return selectedAccount.address;
  }

  /**
   * Getter for the `useRequestQueue` property
   *
   * @returns whether this option is on or off.
   */
  getUseRequestQueue(): boolean {
    return this.state.useRequestQueue;
  }

  /**
   * Sets a custom label for an account
   *
   * @deprecated - Use setAccountName from the AccountsController
   * @param address - the account to set a label for
   * @param label - the custom label for the account
   * @returns the account label
   */
  setAccountLabel(address: string, label: string): string | undefined {
    if (!address) {
      throw new Error(
        `setAccountLabel requires a valid address, got ${String(address)}`,
      );
    }

    const account = this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (account) {
      this.messagingSystem.call(
        'AccountsController:setAccountName',
        account.id,
        label,
      );

      return label;
    }

    return undefined;
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param feature - A key that corresponds to a UI feature.
   * @param activated - Indicates whether or not the UI feature should be displayed
   * @returns the updated featureFlags object.
   */
  setFeatureFlag(feature: string, activated: boolean): Record<string, boolean> {
    const currentFeatureFlags = this.state.featureFlags;
    const updatedFeatureFlags = {
      ...currentFeatureFlags,
      [feature]: activated,
    };

    this.update((state) => {
      state.featureFlags = updatedFeatureFlags;
    });
    return updatedFeatureFlags;
  }

  /**
   * Updates the `preferences` property, which is an object. These are user-controlled features
   * found in the settings page.
   *
   * @param preference - The preference to enable or disable.
   * @param value - Indicates whether or not the preference should be enabled or disabled.
   * @returns Promises a updated Preferences object.
   */
  setPreference(
    preference: keyof Preferences,
    value: Preferences[typeof preference],
  ): Preferences {
    const currentPreferences = this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      [preference]: value,
    };

    this.update((state) => {
      state.preferences = updatedPreferences;
    });
    return updatedPreferences;
  }

  /**
   * A getter for the `preferences` property
   *
   * @returns A map of user-selected preferences.
   */
  getPreferences(): Preferences {
    return this.state.preferences;
  }

  /**
   * A getter for the `ipfsGateway` property
   *
   * @returns The current IPFS gateway domain
   */
  getIpfsGateway(): string {
    return this.state.ipfsGateway;
  }

  /**
   * A setter for the `ipfsGateway` property
   *
   * @param domain - The new IPFS gateway domain
   * @returns the update IPFS gateway domain
   */
  setIpfsGateway(domain: string): string {
    this.update((state) => {
      state.ipfsGateway = domain;
    });
    return domain;
  }

  /**
   * A setter for the `isIpfsGatewayEnabled` property
   *
   * @param enabled - Whether or not IPFS is enabled
   */
  setIsIpfsGatewayEnabled(enabled: boolean): void {
    this.update((state) => {
      state.isIpfsGatewayEnabled = enabled;
    });
  }

  /**
   * A setter for the `useAddressBarEnsResolution` property
   *
   * @param useAddressBarEnsResolution - Whether or not user prefers IPFS resolution for domains
   */
  setUseAddressBarEnsResolution(useAddressBarEnsResolution: boolean): void {
    this.update((state) => {
      state.useAddressBarEnsResolution = useAddressBarEnsResolution;
    });
  }

  /**
   * A setter for the `ledgerTransportType` property.
   *
   * @deprecated We no longer support specifying a ledger transport type other
   * than webhid, therefore managing a preference is no longer necessary.
   * @param ledgerTransportType - 'webhid'
   * @returns The transport type that was set.
   */
  setLedgerTransportPreference(
    ledgerTransportType: LedgerTransportTypes,
  ): string {
    this.update((state) => {
      state.ledgerTransportType = ledgerTransportType;
    });
    return ledgerTransportType;
  }

  /**
   * A setter for the user preference to dismiss the seed phrase backup reminder
   *
   * @param dismissSeedBackUpReminder - User preference for dismissing the back up reminder.
   */
  setDismissSeedBackUpReminder(dismissSeedBackUpReminder: boolean): void {
    this.update((state) => {
      state.dismissSeedBackUpReminder = dismissSeedBackUpReminder;
    });
  }

  /**
   * A setter for the incomingTransactions in preference to be updated
   *
   * @param chainId - chainId of the network
   * @param value - preference of certain network, true to be enabled
   */
  setIncomingTransactionsPreferences(chainId: Hex, value: boolean): void {
    const previousValue = this.state.incomingTransactionsPreferences;
    const updatedValue = { ...previousValue, [chainId]: value };
    this.update((state) => {
      state.incomingTransactionsPreferences = updatedValue;
    });
  }

  setServiceWorkerKeepAlivePreference(value: boolean): void {
    this.update((state) => {
      state.enableMV3TimestampSave = value;
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setSnapsAddSnapAccountModalDismissed(value: boolean): void {
    this.update((state) => {
      state.snapsAddSnapAccountModalDismissed = value;
    });
  }
  ///: END:ONLY_INCLUDE_IF

  #handleAccountsControllerSync(
    newAccountsControllerState: AccountsControllerState,
  ): void {
    const { accounts, selectedAccount: selectedAccountId } =
      newAccountsControllerState.internalAccounts;
    const selectedAccount = accounts[selectedAccountId];

    const { identities, lostIdentities } = this.state;

    const addresses = Object.values(accounts).map((account) =>
      account.address.toLowerCase(),
    );

    const updatedLostIdentities = Object.keys(identities).reduce(
      (acc, identity) => {
        if (addresses.includes(identity.toLowerCase())) {
          acc[identity] = identities[identity];
        }
        return acc;
      },
      { ...(lostIdentities ?? {}) },
    );

    const updatedIdentities = Object.values(accounts).reduce(
      (identitiesMap: Record<string, AccountIdentityEntry>, account) => {
        identitiesMap[account.address] = {
          address: account.address,
          name: account.metadata.name,
          lastSelected: account.metadata.lastSelected,
        };

        return identitiesMap;
      },
      {},
    );

    this.update((state) => {
      state.identities = updatedIdentities;
      state.lostIdentities = updatedLostIdentities;
      state.selectedAddress = selectedAccount?.address || ''; // it will be an empty string during onboarding
    });
  }
}
