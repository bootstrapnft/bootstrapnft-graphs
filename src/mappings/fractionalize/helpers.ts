import {
  store,
  dataSource,
  Bytes,
  BigInt,
  Address,
  TypedMap,
  log,
} from '@graphprotocol/graph-ts';
import { VaultUpgradeable} from '../../types/VaultFactoryUpgradeable/VaultUpgradeable';
import {
  Global,
  Asset,
  Token,
  Manager,
  Fee,
  Feature,
  Vault,
  FeeReceipt,
  NftUser,
  Mint,
  NftSwap,
  Redeem,
  Holding,
  VaultDayData,
  VaultHourData,
  VaultCreator,
  FeeTransfer,
} from '../../types/schema';
import { ERC20Metadata } from '../../types/VaultFactoryUpgradeable/ERC20Metadata';
import { ERC677Metadata } from '../../types/VaultFactoryUpgradeable/ERC677Metadata';
import { ADDRESS_ZERO } from './constants';
import { getDateString, getTimeString } from './datetime';

export function getGlobal(): Global {
  let global_id = dataSource.network();
  
  log.info('dataSource.network() {}', [global_id]);

  let global = Global.load(global_id);
  if (!global) {
    global = new Global(global_id);
    global.totalHoldings = BigInt.fromI32(0);
    global.vaultFactory = ADDRESS_ZERO;
    global.feeDistributorAddress = ADDRESS_ZERO;

    let fees = getGlobalFee();
    fees.save();

    global.fees = 'global';
  }
  return global as Global;
}

export function getAsset(assetAddress: Address): Asset {
  let asset = Asset.load(assetAddress.toHexString());
  if (!asset) {
    asset = new Asset(assetAddress.toHexString());

    let erc677 = ERC677Metadata.bind(assetAddress);
    let symbol = erc677.try_symbol();
    let name = erc677.try_name();

    asset.symbol = symbol.reverted ? '' : symbol.value;
    asset.name = name.reverted ? '' : name.value;
  }
  return asset as Asset;
}

export function getToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    token = new Token(tokenAddress.toHexString());
  }
  let erc20 = ERC20Metadata.bind(tokenAddress);
  let symbol = erc20.try_symbol();
  let name = erc20.try_name();
  let totalSupply = erc20.try_totalSupply();

  token.symbol = symbol.reverted ? '' : symbol.value;
  token.name = name.reverted ? '' : name.value;
  token.totalSupply = totalSupply.reverted
    ? BigInt.fromI32(0)
    : totalSupply.value;
  return token as Token;
}

export function getManager(managerAddress: Address): Manager {
  let manager = Manager.load(managerAddress.toHexString());
  if (!manager) {
    manager = new Manager(managerAddress.toHexString());
  }
  return manager as Manager;
}

export function getGlobalFee(): Fee {
  let feeId = 'global';
  let fees = Fee.load(feeId);
  if (!fees) {
    fees = new Fee(feeId);
    fees.mintFee = BigInt.fromI32(0);
    fees.randomRedeemFee = BigInt.fromI32(0);
    fees.targetRedeemFee = BigInt.fromI32(0);
    fees.swapFee = BigInt.fromI32(0);
    fees.randomSwapFee = BigInt.fromI32(0);
    fees.targetSwapFee = BigInt.fromI32(0);
  }
  return fees as Fee;
}

export function getFee(feesAddress: Address): Fee {
  let fees = Fee.load(feesAddress.toHexString());
  if (!fees) {
    fees = new Fee(feesAddress.toHexString());
    fees.mintFee = BigInt.fromI32(0);
    fees.randomRedeemFee = BigInt.fromI32(0);
    fees.targetRedeemFee = BigInt.fromI32(0);
    fees.swapFee = BigInt.fromI32(0);
    fees.randomSwapFee = BigInt.fromI32(0);
    fees.targetSwapFee = BigInt.fromI32(0);
  }
  return fees as Fee;
}

export function getFeature(featuresAddress: Address): Feature {
  let features = Feature.load(featuresAddress.toHexString());
  if (!features) {
    features = new Feature(featuresAddress.toHexString());
    features.enableMint = false;
    features.enableRandomRedeem = false;
    features.enableTargetRedeem = false;
    features.enableRandomSwap = false;
    features.enableTargetSwap = false;
  }
  return features as Feature;
}

export function updateManager(vault: Vault, managerAddress: Address): Vault {
  let manager = getManager(managerAddress);
  manager.save();

  vault.manager = manager.id;
  vault.isFinalized =
    managerAddress.toHexString() == ADDRESS_ZERO.toHexString();

  return vault;
}

export function getVault(vaultAddress: Address): Vault {
  let vault = Vault.load(vaultAddress.toHexString());
  if (!vault) {
    vault = new Vault(vaultAddress.toHexString());

    let vaultInstance = VaultUpgradeable.bind(vaultAddress);
    let assetAddressFromInstance = vaultInstance.try_assetAddress();
    let managerAddressFromInstance = vaultInstance.try_manager();
    let is1155FromInstance = vaultInstance.try_is1155();
    let allowAllItemsFromInstance = vaultInstance.try_allowAllItems();

    let assetAddress = assetAddressFromInstance.reverted
      ? ADDRESS_ZERO
      : assetAddressFromInstance.value;
    let managerAddress = managerAddressFromInstance.reverted
      ? ADDRESS_ZERO
      : managerAddressFromInstance.value;
    let is1155 = is1155FromInstance.reverted ? false : is1155FromInstance.value;
    let allowAllItems = allowAllItemsFromInstance.reverted
      ? false
      : allowAllItemsFromInstance.value;

    vault.is1155 = is1155;
    vault.allowAllItems = allowAllItems;
    vault.vaultId = BigInt.fromI32(0);

    let token = getToken(vaultAddress);
    vault.token = token.id;
    token.save();

    let asset = getAsset(assetAddress);
    vault.asset = asset.id;
    asset.save();

    vault = updateManager(vault as Vault, managerAddress);

    let fees = getFee(vaultAddress);
    vault.fees = fees.id;
    fees.save();

    let features = getFeature(vaultAddress);
    vault.features = features.id;
    features.save();

    vault.totalFees = BigInt.fromI32(0);
    vault.allocTotal = BigInt.fromI32(0);

    vault.createdAt = BigInt.fromI32(0);

    vault.totalMints = BigInt.fromI32(0);
    vault.totalSwaps = BigInt.fromI32(0);
    vault.totalRedeems = BigInt.fromI32(0);
    vault.totalHoldings = BigInt.fromI32(0);
    vault.usesFactoryFees = true;
  }

  return vault as Vault;
}

export function getVaultCreator(address: Address): VaultCreator {
  let vaultCreator = VaultCreator.load(address.toHexString());
  if (!vaultCreator) {
    vaultCreator = new VaultCreator(address.toHexString());
  }
  return vaultCreator as VaultCreator;
}



export function getFeeReceipt(txHash: Bytes): FeeReceipt {
  let feeReceiptId = txHash.toHexString();
  let feeReceipt = FeeReceipt.load(feeReceiptId);
  if (!feeReceipt) {
    feeReceipt = new FeeReceipt(feeReceiptId);
    feeReceipt.date = BigInt.fromI32(0);
    // vault not set
    // token not set
  }
  return feeReceipt as FeeReceipt;
}

export function getFeeTransfer(txHash: Bytes, to: Address): FeeTransfer {
  let feeTransferId = txHash.toHexString() + '-' + to.toHexString();
  let feeTransfer = FeeTransfer.load(feeTransferId);
  if (!feeTransfer) {
    feeTransfer = new FeeTransfer(feeTransferId);
  }
  return feeTransfer as FeeTransfer;
}


export function getNftUser(userAddress: Address): NftUser {
  let user = NftUser.load(userAddress.toHexString());
  if (!user) {
    user = new NftUser(userAddress.toHexString());
  }
  return user as NftUser;
}

export function getMint(txHash: Bytes): Mint {
  let mint = Mint.load(txHash.toHexString());
  if (!mint) {
    mint = new Mint(txHash.toHexString());
  }
  return mint as Mint;
}

export function getNftSwap(txHash: Bytes): NftSwap {
  let swap = NftSwap.load(txHash.toHexString());
  if (!swap) {
    swap = new NftSwap(txHash.toHexString());
  }
  return swap as NftSwap;
}


export function getRedeem(txHash: Bytes): Redeem {
  let redeem = Redeem.load(txHash.toHexString());
  if (!redeem) {
    redeem = new Redeem(txHash.toHexString());
  }
  return redeem as Redeem;
}


export function getHolding(tokenId: BigInt, vaultAddress: Address): Holding {
  let holdingId = tokenId.toHexString() + '-' + vaultAddress.toHexString();
  let holding = Holding.load(holdingId);
  if (!holding) {
    holding = new Holding(holdingId);
    holding.tokenId = tokenId;
    holding.amount = BigInt.fromI32(0);
    holding.vault = vaultAddress.toHexString();
  }
  return holding as Holding;
}

export function addToHoldings(
  vaultAddress: Address,
  nftIds: BigInt[],
  amounts: BigInt[],
  date: BigInt,
): void {
  let vault = getVault(vaultAddress);
  let is1155 = vault.is1155;
  for (let i = 0; i < nftIds.length; i = i + 1) {
    let tokenId = nftIds[i];
    let holding = getHolding(tokenId, vaultAddress);
    holding.dateAdded = date;
    if (is1155) {
      let amount = amounts[i];
      holding.amount = holding.amount.plus(amount);
    } else {
      holding.amount = BigInt.fromI32(1);
    }
    holding.save();
  }
}

/**
 * Ensures that
 */
export function transformMintAmounts(
  vaultAddress: Address,
  nftIds: BigInt[],
  amounts: BigInt[],
): BigInt[] {
  let vault = getVault(vaultAddress);
  let is1155 = vault.is1155;
  if (is1155) {
    // No transformation needed, amounts are enforced in the call
    return amounts;
  }
  // Amounts not enforced, map all ERC721s to ensure thay have an `amount` of 1 in the response
  let transformedAmounts = new Array<BigInt>();
  for (let i = 0; i < nftIds.length; i = i + 1) {
    transformedAmounts[i] = BigInt.fromI32(1);
  }
  return transformedAmounts;
}

export function removeFromHoldings(
  vaultAddress: Address,
  nftIds: BigInt[],
): void {
  for (let i = 0; i < nftIds.length; i = i + 1) {
    let tokenId = nftIds[i];
    let holding = getHolding(tokenId, vaultAddress);
    holding.amount =
      holding.amount == BigInt.fromI32(0)
        ? BigInt.fromI32(0)
        : holding.amount.minus(BigInt.fromI32(1));
    holding.save();
    if (holding.amount == BigInt.fromI32(0)) {
      store.remove('Holding', holding.id);
    }
  }
}

export function getVaultDayData(
  vaultAddress: Address,
  date: BigInt,
): VaultDayData {
  let dateString = getDateString(date);
  let vaultDayDataId = dateString + '-' + vaultAddress.toHexString();
  let vaultDayData = VaultDayData.load(vaultDayDataId);
  if (!vaultDayData) {
    vaultDayData = new VaultDayData(vaultDayDataId);
    vaultDayData.date = date;
    vaultDayData.mintsCount = BigInt.fromI32(0);
    vaultDayData.swapsCount = BigInt.fromI32(0);
    vaultDayData.redeemsCount = BigInt.fromI32(0);
    vaultDayData.holdingsCount = BigInt.fromI32(0);
    vaultDayData.totalMints = BigInt.fromI32(0);
    vaultDayData.totalSwaps = BigInt.fromI32(0);
    vaultDayData.totalRedeems = BigInt.fromI32(0);
    vaultDayData.totalHoldings = BigInt.fromI32(0);
    vaultDayData.vault = vaultAddress.toHexString();
  }
  return vaultDayData as VaultDayData;
}

export function getVaultHourData(
  vaultAddress: Address,
  date: BigInt,
): VaultHourData {
  let timeString = getTimeString(date);
  let vaultHourDataId = timeString + '-' + vaultAddress.toHexString();
  let vaultHourData = VaultHourData.load(vaultHourDataId);
  if (!vaultHourData) {
    vaultHourData = new VaultHourData(vaultHourDataId);
    vaultHourData.date = date;
    vaultHourData.mintsCount = BigInt.fromI32(0);
    vaultHourData.swapsCount = BigInt.fromI32(0);
    vaultHourData.redeemsCount = BigInt.fromI32(0);
    vaultHourData.holdingsCount = BigInt.fromI32(0);
    vaultHourData.totalMints = BigInt.fromI32(0);
    vaultHourData.totalSwaps = BigInt.fromI32(0);
    vaultHourData.totalRedeems = BigInt.fromI32(0);
    vaultHourData.totalHoldings = BigInt.fromI32(0);
    vaultHourData.vault = vaultAddress.toHexString();
  }
  return vaultHourData as VaultHourData;
}