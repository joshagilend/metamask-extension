import { invalidParams, MethodNames } from '@metamask/permission-controller';
import { isNonEmptyArray, KnownCaipNamespace } from '@metamask/utils';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { parseScopeString } from './scope';

export const revokePermissionsHandler = {
  methodNames: [MethodNames.revokePermissions],
  implementation: revokePermissionsImplementation,
  hookNames: {
    revokePermissionsForOrigin: true,
    getPermissionsForOrigin: true,
    updateCaveat: true,
  },
};

/**
 * Revoke Permissions implementation to be used in JsonRpcEngine middleware.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.revokePermissionsForOrigin - A hook that revokes given permission keys for an origin
 * @param options.getPermissionsForOrigin
 * @param options.updateCaveat
 * @returns A promise that resolves to nothing
 */
function revokePermissionsImplementation(
  req,
  res,
  _next,
  end,
  { revokePermissionsForOrigin, getPermissionsForOrigin, updateCaveat },
) {
  const { params, origin } = req;

  const param = params?.[0];

  if (!param) {
    return end(invalidParams({ data: { request: req } }));
  }

  // For now, this API revokes the entire permission key
  // even if caveats are specified.
  const permissionKeys = Object.keys(param).filter(
    (name) => name !== Caip25EndowmentPermissionName,
  );

  if (!isNonEmptyArray(permissionKeys)) {
    return end(invalidParams({ data: { request: req } }));
  }

  revokePermissionsForOrigin(permissionKeys);

  const permissions = getPermissionsForOrigin(origin) || {};
  const caip25Endowment = permissions?.[Caip25EndowmentPermissionName];
  const caip25Caveat = caip25Endowment?.caveats.find(
    ({ type }) => type === Caip25CaveatType,
  );

  if (
    process.env.BARAD_DUR &&
    permissionKeys.includes(RestrictedMethods.eth_accounts) &&
    caip25Caveat
  ) {
    // should we remove accounts from required scopes? if so doesn't that mean we should
    // just revoke the caip25Endowment entirely?

    const requiredScopesWithoutEip155Accounts = {};
    Object.entries(caip25Caveat.value.requiredScopes).forEach(
      ([scopeString, scopeObject]) => {
        const { namespace } = parseScopeString(scopeString);
        requiredScopesWithoutEip155Accounts[scopeString] = {
          ...scopeObject,
          accounts:
            namespace === KnownCaipNamespace.Eip155 ? [] : scopeObject.accounts,
        };
      },
    );

    const optionalScopesWithoutEip155Accounts = {};
    Object.entries(caip25Caveat.value.optionalScopes).forEach(
      ([scopeString, scopeObject]) => {
        const { namespace } = parseScopeString(scopeString);
        optionalScopesWithoutEip155Accounts[scopeString] = {
          ...scopeObject,
          accounts:
            namespace === KnownCaipNamespace.Eip155 ? [] : scopeObject.accounts,
        };
      },
    );

    updateCaveat(origin, Caip25EndowmentPermissionName, Caip25CaveatType, {
      ...caip25Caveat.value,
      requiredScopes: requiredScopesWithoutEip155Accounts,
      optionalScopes: optionalScopesWithoutEip155Accounts,
    });
  }

  res.result = null;

  return end();
}
