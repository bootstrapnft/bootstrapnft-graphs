import {
  NewVault as NewVaultEvent,
  UpdateFactoryFees as UpdateFactoryFeesEvent,
  UpdateVaultFees as UpdateVaultFeesEvent,
  DisableVaultFees as DisableVaultFeesEvent,
  VaultFactoryUpgradeable as VaultFactory,
} from '../../types/VaultFactoryUpgradeable/VaultFactoryUpgradeable';
import { FeeDistributor } from '../../types/VaultFactoryUpgradeable/FeeDistributor';
import {
  getFee,
  getGlobal,
  getGlobalFee,
  getVault,
  getVaultCreator,
} from './helpers';
import {
  VaultUpgradeable as VaultTemplate,
} from '../../types/templates';
import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { ADDRESS_ZERO } from './constants';

function newFeeDistributor(
  vaultFactoryAddress: Address,
  feeDistributorAddress: Address,
): void {
  log.info('newFeeDistributor {} {}', [
    vaultFactoryAddress.toHexString(),
    feeDistributorAddress.toHexString(),
  ]);

  let global = getGlobal();
  if (global.feeDistributorAddress == feeDistributorAddress) {
    return;
  }
  global.vaultFactory = vaultFactoryAddress;
  global.feeDistributorAddress = feeDistributorAddress;
  global.save();
}


export function handleNewVault(event: NewVaultEvent): void {
  let vaultAddress = event.params.vaultAddress;
  let vaultCreatorAddress = event.transaction.from;

  let vaultCreator = getVaultCreator(vaultCreatorAddress);
  vaultCreator.save();

  let vault = getVault(vaultAddress);
  vault.vaultId = event.params.vaultId;
  vault.createdAt = event.block.timestamp;
  vault.createdBy = vaultCreator.id;
  vault.save();

  VaultTemplate.create(vaultAddress);

  let vaultFactoryAddress = event.address;

  let vaultFactory = VaultFactory.bind(vaultFactoryAddress);
  let feeDistributorAddressFromInstance = vaultFactory.try_feeDistributor();
  let feeDistributorAddress = feeDistributorAddressFromInstance.reverted
    ? ADDRESS_ZERO
    : feeDistributorAddressFromInstance.value;

  // check if factory mint fees exist
  let factoryMintFeesFromInstance = vaultFactory.try_factoryMintFee();
  if (!factoryMintFeesFromInstance.reverted) {
    let fee = getFee(vaultAddress);
    fee.mintFee = vaultFactory.factoryMintFee();
    fee.randomRedeemFee = vaultFactory.factoryRandomRedeemFee();
    fee.targetRedeemFee = vaultFactory.factoryTargetRedeemFee();
    fee.randomSwapFee = vaultFactory.factoryRandomRedeemFee();
    fee.targetSwapFee = vaultFactory.factoryTargetSwapFee();
    fee.save();
  }
  newFeeDistributor(vaultFactoryAddress, feeDistributorAddress);
}

function getVaultAddress(
  vaultId: BigInt,
  vaultFactoryAddress: Address,
): Address {
  let vaultFactoryInstance = VaultFactory.bind(vaultFactoryAddress);
  let vaultAddressFromInstance = vaultFactoryInstance.try_vault(vaultId);
  let vaultAddress = vaultAddressFromInstance.reverted
    ? ADDRESS_ZERO
    : vaultAddressFromInstance.value;

  return vaultAddress;
}

export function handleUpdateFactoryFees(event: UpdateFactoryFeesEvent): void {
  let global = getGlobal();
  global.fees = 'global';

  let fees = getGlobalFee();
  fees.mintFee = event.params.mintFee;
  fees.randomRedeemFee = event.params.randomRedeemFee;
  fees.targetRedeemFee = event.params.targetRedeemFee;
  fees.randomSwapFee = event.params.randomSwapFee;
  fees.targetSwapFee = event.params.targetSwapFee;
  fees.save();

  global.save();
}

export function handleUpdateVaultFees(event: UpdateVaultFeesEvent): void {
  let vaultId = event.params.vaultId;
  let vaultAddress = getVaultAddress(vaultId, event.address);
  let vault = getVault(vaultAddress);
  let fee = getFee(vaultAddress);

  vault.usesFactoryFees = false;
  vault.save();

  fee.mintFee = event.params.mintFee;
  fee.randomRedeemFee = event.params.randomRedeemFee;
  fee.targetRedeemFee = event.params.targetRedeemFee;
  fee.randomSwapFee = event.params.randomSwapFee;
  fee.targetSwapFee = event.params.targetSwapFee;
  fee.save();
}

export function handleDisableVaultFees(event: DisableVaultFeesEvent): void {
  let vaultId = event.params.vaultId;
  let vaultAddress = getVaultAddress(vaultId, event.address);
  let vault = getVault(vaultAddress);
  vault.usesFactoryFees = true;
  vault.save();
}
