import { MethodNames } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  KnownNotifications,
  KnownRpcMethods,
} from '@metamask/multichain';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { getPermissionBackgroundApiMethods } from './background-api';
import { PermissionNames } from './specifications';

describe('permission background API methods', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('addPermittedAccount', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccount('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccount('foo.com', '0x1'),
      ).toThrow(
        new Error('tried to add accounts when none have been permissioned'),
      );
    });

    it('calls updateCaveat with the account added', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedAccount('foo.com', '0x4');

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
              ],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:10:0x2',
                'eip155:10:0x3',
                'eip155:10:0x1',
                'eip155:10:0x4',
              ],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
              ],
            },
            'wallet:eip155': {
              methods: [],
              notifications: [],
              accounts: [
                'wallet:eip155:0x2',
                'wallet:eip155:0x3',
                'wallet:eip155:0x1',
                'wallet:eip155:0x4',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('addPermittedAccounts', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccounts('foo.com', ['0x1']);
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccounts('foo.com', ['0x1']),
      ).toThrow(
        new Error('tried to add accounts when none have been permissioned'),
      );
    });

    it('calls updateCaveat with the accounts added to only eip155 scopes and all accounts for eip155 scopes synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedAccounts('foo.com', ['0x4', '0x5']);

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
                'eip155:1:0x5',
              ],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:10:0x2',
                'eip155:10:0x3',
                'eip155:10:0x1',
                'eip155:10:0x4',
                'eip155:10:0x5',
              ],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
                'eip155:1:0x5',
              ],
            },
            'wallet:eip155': {
              methods: [],
              notifications: [],
              accounts: [
                'wallet:eip155:0x2',
                'wallet:eip155:0x3',
                'wallet:eip155:0x1',
                'wallet:eip155:0x4',
                'wallet:eip155:0x5',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('removePermittedAccount', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedAccount('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedAccount('foo.com', '0x1'),
      ).toThrow(
        new Error('tried to remove accounts when none have been permissioned'),
      );
    });

    it('does nothing if the account being removed does not exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
        revokePermission: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedAccount('foo.com', '0xdeadbeef');

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
      expect(permissionController.revokePermission).not.toHaveBeenCalled();
    });

    it('revokes the entire permission if the removed account is the only eip:155 scoped account', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedAccount('foo.com', '0x1');

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the account removed and all eip155 accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedAccount('foo.com', '0x2');

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x3', 'eip155:1:0x1'],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: ['eip155:10:0x3', 'eip155:10:0x1'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x3', 'eip155:1:0x1'],
            },
            'wallet:eip155': {
              methods: [],
              notifications: [],
              accounts: ['wallet:eip155:0x3', 'wallet:eip155:0x1'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('requestAccountsAndChainPermissionsWithId', () => {
    it('requests eth_accounts and permittedChains approval and returns the request id', async () => {
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          approvedChainIds: ['0x1', '0x5'],
          approvedAccounts: ['0xdeadbeef'],
        }),
      };
      const permissionController = {
        grantPermissions: jest.fn(),
      };

      const result = getPermissionBackgroundApiMethods({
        approvalController,
        permissionController,
      }).requestAccountsAndChainPermissionsWithId('foo.com');

      const { id } =
        approvalController.addAndShowApprovalRequest.mock.calls[0][0];

      expect(result).toStrictEqual(id);
      expect(approvalController.addAndShowApprovalRequest).toHaveBeenCalledWith(
        {
          id,
          origin: 'foo.com',
          requestData: {
            metadata: {
              id,
              origin: 'foo.com',
            },
            permissions: {
              [RestrictedMethods.eth_accounts]: {},
              [PermissionNames.permittedChains]: {},
            },
          },
          type: MethodNames.requestPermissions,
        },
      );
    });

    it('grants a legacy CAIP-25 permission (isMultichainOrigin: false) with the approved eip155 chainIds and accounts', async () => {
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          approvedChainIds: ['0x1', '0x5'],
          approvedAccounts: ['0xdeadbeef'],
        }),
      };
      const permissionController = {
        grantPermissions: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        approvalController,
        permissionController,
      }).requestAccountsAndChainPermissionsWithId('foo.com');

      await flushPromises();

      expect(permissionController.grantPermissions).toHaveBeenCalledWith({
        subject: {
          origin: 'foo.com',
        },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      methods: KnownRpcMethods.eip155,
                      notifications: KnownNotifications.eip155,
                      accounts: ['eip155:1:0xdeadbeef'],
                    },
                    'eip155:5': {
                      methods: KnownRpcMethods.eip155,
                      notifications: KnownNotifications.eip155,
                      accounts: ['eip155:5:0xdeadbeef'],
                    },
                    'wallet:eip155': {
                      methods: [],
                      notifications: [],
                      accounts: ['wallet:eip155:0xdeadbeef'],
                    },
                  },
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      });
    });
  });

  describe('addPermittedChain', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChain('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChain('foo.com', '0x1'),
      ).toThrow(
        new Error('tried to add chains when none have been permissioned'),
      );
    });

    it('calls updateCaveat with the chain added and all eip155 accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x1'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedChain('foo.com', '0x539'); // 1337

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:1337': {
              methods: KnownRpcMethods.eip155,
              notifications: KnownNotifications.eip155,
              accounts: ['eip155:1337:0x1', 'eip155:1337:0x2'],
            },
            'wallet:eip155': {
              methods: [],
              notifications: [],
              accounts: ['wallet:eip155:0x1', 'wallet:eip155:0x2'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('addPermittedChains', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChains('foo.com', ['0x1']);
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChains('foo.com', ['0x1']),
      ).toThrow(
        new Error('tried to add chains when none have been permissioned'),
      );
    });

    it('calls updateCaveat with the chains added and all eip155 accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x1'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedChains('foo.com', ['0x4', '0x5']);

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:4': {
              methods: KnownRpcMethods.eip155,
              notifications: KnownNotifications.eip155,
              accounts: ['eip155:4:0x1', 'eip155:4:0x2'],
            },
            'eip155:5': {
              methods: KnownRpcMethods.eip155,
              notifications: KnownNotifications.eip155,
              accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
            },
            'wallet:eip155': {
              methods: [],
              notifications: [],
              accounts: ['wallet:eip155:0x1', 'wallet:eip155:0x2'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('removePermittedChain', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedChain('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedChain('foo.com', '0x1'),
      ).toThrow(
        new Error('tried to remove chains when none have been permissioned'),
      );
    });

    it('does nothing if the chain being removed does not exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
        revokePermission: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedChain('foo.com', '0xdeadbeef');

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
      expect(permissionController.revokePermission).not.toHaveBeenCalled();
    });

    it('revokes the entire permission if the removed chain is the only eip:155 scope', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedChain('foo.com', '0x1');

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the chain removed', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedChain('foo.com', '0xa'); // 10

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });
});
