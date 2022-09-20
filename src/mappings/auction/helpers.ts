import {
  BigDecimal,
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum
} from '@graphprotocol/graph-ts'
import {
  Pool,
  User,
  PoolToken,
  PoolShare,
  TokenPrice,
  Transaction,
  Auction, CrpPoolShare
} from '../../types/schema'
import { BTokenBytes } from '../../types/templates/Pool/BTokenBytes'
import { BToken } from '../../types/templates/Pool/BToken'
import { CRPFactory } from '../../types/Factory/CRPFactory'
import { ConfigurableRightsPool } from '../../types/Factory/ConfigurableRightsPool'

export let ZERO_BD = BigDecimal.fromString('0')

let network = dataSource.network()

// Config for mainnet
let WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
let USD = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
let DAI = '0x6b175474e89094c44da98b954eedeac495271d0f'
let CRP_FACTORY = '0xed52D8E202401645eDAD1c0AA21e872498ce47D0'

if (network == 'kovan') {
  WETH = '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
  USD = '0x2f375e94fc336cdec2dc0ccb5277fe59cbf1cae5'
  DAI = '0x1528f3fcc26d13f7079325fb78d9442607781c8c'
  CRP_FACTORY = '0x53265f0e014995363AE54DAd7059c018BaDbcD74'
}

if (network == 'rinkeby') {
  WETH='0x02ddd013c9c61bdb5f6116446a2cf8557eb05206'
  USD='0x6c97d2dda691c7eeeffcf7ff561d9cc596c94739'
  DAI='0xa3fce8597ae238f1050c382f1f94db8c646529a9'
  CRP_FACTORY='0x7093af13b4fc882e4023b9336cc6097a58eff9b8'
}
if (network == 'shibuya') {
  WETH='0xde4539989309d3c59c10a4cf8ce307bc1bacd287'
  USD='0xdedba5fb4f998b533ffcbeba5f2c053624fe51e8'
  DAI='0x0457ad7b48d98e3cd463b9f9d14efed56332268d'
  CRP_FACTORY='0xf43045c6a98da0e018678f110c8d20c726d37062'
}
if (network == 'ropsten') {
  WETH='0xb0bf40e9a86361b7bde8c02bcf0c816e9b12eb7f'
  USD='0x749247abed4045e94241184976b9faaaf017f7e3'
  DAI='0xb5c07afd9eda52ca699dbbfa85c3a41085221880'
  CRP_FACTORY='0x745805d6721108c0ea25183b741d47e39d3d80d0'
}
if (network == 'mumbai') {
  WETH='0xd23bbe4386e2a738085990bad5773cc16561b910'
  USD='0x3c666c26baf19de73f9bacd1453894602d55a162'
  DAI='0x948b2f671242cc12dda4abc7e9fd348f6cfaf3db'
  CRP_FACTORY='0xf365f2da5df4583015782e4a64f80ad6cce0a7bd'
}

export function hexToDecimal(hexString: string, decimals: i32): BigDecimal {
  let bytes = Bytes.fromHexString(hexString).reverse() as Bytes
  let bi = BigInt.fromUnsignedBytes(bytes)
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return bi.divDecimal(scale)
}

export function bigIntToDecimal(amount: BigInt, decimals: i32): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.toBigDecimal().div(scale)
}

export function tokenToDecimal(amount: BigDecimal, decimals: i32): BigDecimal {
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal()
  return amount.div(scale)
}

export function createPoolShareEntity(id: string, pool: string, user: string): void {
  let poolShare = new PoolShare(id)

  createUserEntity(user)

  poolShare.userAddress = user
  poolShare.poolId = pool
  poolShare.balance = ZERO_BD
  poolShare.save()
}

export function createCrpPoolShareEntity(id: string, pool: string, user: string): void {
  let poolShare = new CrpPoolShare(id)

  createUserEntity(user)

  poolShare.userAddress = user
  poolShare.poolId = pool
  poolShare.balance = ZERO_BD
  poolShare.save()
}

export function createPoolTokenEntity(id: string, pool: string, address: string): void {
  let token = BToken.bind(Address.fromString(address))
  let tokenBytes = BTokenBytes.bind(Address.fromString(address))
  let symbol = ''
  let name = ''
  let decimals = 18

  // COMMENT THE LINES BELOW OUT FOR LOCAL DEV ON KOVAN

  let symbolCall = token.try_symbol()
  let nameCall = token.try_name()
  let decimalCall = token.try_decimals()

  if (symbolCall.reverted) {
    let symbolBytesCall = tokenBytes.try_symbol()
    if (!symbolBytesCall.reverted) {
      symbol = symbolBytesCall.value.toString()
    }
  } else {
    symbol = symbolCall.value
  }

  if (nameCall.reverted) {
    let nameBytesCall = tokenBytes.try_name()
    if (!nameBytesCall.reverted) {
      name = nameBytesCall.value.toString()
    }
  } else {
    name = nameCall.value
  }

  if (!decimalCall.reverted) {
    decimals = decimalCall.value
  }

  // COMMENT THE LINES ABOVE OUT FOR LOCAL DEV ON KOVAN

  // !!! COMMENT THE LINES BELOW OUT FOR NON-LOCAL DEPLOYMENT
  // This code allows Symbols to be added when testing on local Kovan
  /*
  if(address == '0xd0a1e359811322d97991e03f863a0c30c2cf029c')
    symbol = 'WETH';
  else if(address == '0x1528f3fcc26d13f7079325fb78d9442607781c8c')
    symbol = 'DAI'
  else if(address == '0xef13c0c8abcaf5767160018d268f9697ae4f5375')
    symbol = 'MKR'
  else if(address == '0x2f375e94fc336cdec2dc0ccb5277fe59cbf1cae5')
    symbol = 'USDC'
  else if(address == '0x1f1f156e0317167c11aa412e3d1435ea29dc3cce')
    symbol = 'BAT'
  else if(address == '0x86436bce20258a6dcfe48c9512d4d49a30c4d8c4')
    symbol = 'SNX'
  else if(address == '0x8c9e6c40d3402480ace624730524facc5482798c')
    symbol = 'REP'
  */
  // !!! COMMENT THE LINES ABOVE OUT FOR NON-LOCAL DEPLOYMENT

  let poolToken = new PoolToken(id)
  poolToken.poolId = pool
  poolToken.address = address
  poolToken.name = name
  poolToken.symbol = symbol
  poolToken.decimals = decimals
  poolToken.balance = ZERO_BD
  poolToken.denormWeight = ZERO_BD
  poolToken.save()
}

export function updatePoolLiquidity(id: string): void {
  let pool = Pool.load(id)
  if (pool == null) return
  let tokensList: Array<Bytes> = pool.tokensList

  if (pool.tokensCount.equals(BigInt.fromI32(0))) {
    pool.liquidity = ZERO_BD
    pool.save()
    return
  }

  if (!tokensList || pool.tokensCount.lt(BigInt.fromI32(2)) || !pool.publicSwap) return

  // Find pool liquidity

  let hasPrice = false
  let hasUsdPrice = false
  let poolLiquidity = ZERO_BD

  if (tokensList.includes(Address.fromString(USD))) {
    let usdPoolTokenId = id.concat('-').concat(USD)
    let usdPoolToken = PoolToken.load(usdPoolTokenId)
    if (usdPoolToken == null) return
    poolLiquidity = usdPoolToken.balance.div(usdPoolToken.denormWeight).times(pool.totalWeight)
    hasPrice = true
    hasUsdPrice = true
  } else if (tokensList.includes(Address.fromString(WETH))) {
    let wethTokenPrice = TokenPrice.load(WETH)
    if (wethTokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(WETH)
      let poolToken = PoolToken.load(poolTokenId)
      if (poolToken == null) return
      poolLiquidity = wethTokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      hasPrice = true
    }
  } else if (tokensList.includes(Address.fromString(DAI))) {
    let daiTokenPrice = TokenPrice.load(DAI)
    if (daiTokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(DAI)
      let poolToken = PoolToken.load(poolTokenId)
      if (poolToken == null) return
      poolLiquidity = daiTokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      hasPrice = true
    }
  }

  // Create or update token price

  if (hasPrice) {
    for (let i: i32 = 0; i < tokensList.length; i++) {
      let tokenPriceId = tokensList[i].toHexString()
      let tokenPrice = TokenPrice.load(tokenPriceId)
      if (tokenPrice == null) {
        tokenPrice = new TokenPrice(tokenPriceId)
        tokenPrice.poolTokenId = ''
        tokenPrice.poolLiquidity = ZERO_BD
      }

      let poolTokenId = id.concat('-').concat(tokenPriceId)
      let poolToken = PoolToken.load(poolTokenId)
      if (poolToken == null) return
      if (
        pool.active && pool.tokensCount.notEqual(BigInt.fromI32(0)) && pool.publicSwap &&
        (tokenPrice.poolTokenId == poolTokenId || poolLiquidity.gt(tokenPrice.poolLiquidity)) &&
        (
          (tokenPriceId != WETH.toString() && tokenPriceId != DAI.toString()) ||
          (pool.tokensCount.equals(BigInt.fromI32(2)) && hasUsdPrice)
        )
      ) {
        tokenPrice.price = ZERO_BD

        if (poolToken.balance.gt(ZERO_BD)) {
          tokenPrice.price = poolLiquidity.div(pool.totalWeight).times(poolToken.denormWeight).div(poolToken.balance)
        }

        tokenPrice.symbol = poolToken.symbol
        tokenPrice.name = poolToken.name
        tokenPrice.decimals = poolToken.decimals
        tokenPrice.poolLiquidity = poolLiquidity
        tokenPrice.poolTokenId = poolTokenId
        tokenPrice.save()
      }
    }
  }

  // Update pool liquidity

  let liquidity = ZERO_BD
  let denormWeight = ZERO_BD

  for (let i: i32 = 0; i < tokensList.length; i++) {
    let tokenPriceId = tokensList[i].toHexString()
    let tokenPrice = TokenPrice.load(tokenPriceId)
    if (tokenPrice !== null) {
      let poolTokenId = id.concat('-').concat(tokenPriceId)
      let poolToken = PoolToken.load(poolTokenId)
      if (poolToken == null) return
      if (tokenPrice.price.gt(ZERO_BD) && poolToken.denormWeight.gt(denormWeight)) {
        denormWeight = poolToken.denormWeight
        liquidity = tokenPrice.price.times(poolToken.balance).div(poolToken.denormWeight).times(pool.totalWeight)
      }
    }
  }

  let factory = Auction.load('1')
  if (factory == null) return
  factory.totalLiquidity = factory.totalLiquidity.minus(pool.liquidity).plus(liquidity)
  factory.save()

  pool.liquidity = liquidity
  pool.save()
}

export function decrPoolCount(active: boolean, finalized: boolean, crp: boolean): void {
  if (active) {
    let factory = Auction.load('1')
    if (factory == null) return
    factory.poolCount = factory.poolCount - 1
    if (finalized) factory.finalizedPoolCount = factory.finalizedPoolCount - 1
    if (crp) factory.crpCount = factory.crpCount - 1
    factory.save()
  }
}

export function saveTransaction(event: ethereum.Event, eventName: string): void {
  let tx = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let userAddress = event.transaction.from.toHex()
  let transaction = Transaction.load(tx)
  if (transaction == null) {
    transaction = new Transaction(tx)
  }
  transaction.event = eventName
  transaction.poolAddress = event.address.toHex()
  transaction.userAddress = userAddress
  //transaction.gasUsed = event.transaction.gasUsed.toBigDecimal()
  transaction.gasPrice = event.transaction.gasPrice.toBigDecimal()
  transaction.tx = event.transaction.hash
  transaction.timestamp = event.block.timestamp.toI32()
  transaction.block = event.block.number.toI32()
  transaction.save()

  createUserEntity(userAddress)
}

export function createUserEntity(address: string): void {
  if (User.load(address) == null) {
    let user = new User(address)
    user.save()
  }
}

export function isCrp(address: Address): boolean {
  let crpFactory = CRPFactory.bind(Address.fromString(CRP_FACTORY))
  let isCrp = crpFactory.try_isCrp(address)
  if (isCrp.reverted) return false
  return isCrp.value
}

export function getCrpUnderlyingPool(crp: ConfigurableRightsPool): string | null {
  let bPool = crp.try_bPool()
  if (bPool.reverted) return null;
  return bPool.value.toHexString()
}

export function getCrpController(crp: ConfigurableRightsPool): string | null {
  let controller = crp.try_getController()
  if (controller.reverted) return null;
  return controller.value.toHexString()
}

export function getCrpSymbol(crp: ConfigurableRightsPool): string {
  let symbol = crp.try_symbol()
  if (symbol.reverted) return ''
  return symbol.value
}

export function getCrpName(crp: ConfigurableRightsPool): string {
  let name = crp.try_name()
  if (name.reverted) return ''
  return name.value
}

export function getCrpCap(crp: ConfigurableRightsPool): BigInt {
  let cap = crp.try_bspCap()
  if (cap.reverted) return BigInt.fromI32(0)
  return cap.value
}

export function getCrpRights(crp: ConfigurableRightsPool): string[] {
  let rights = crp.try_rights()
  if (rights.reverted) return []
  let rightsArr: string[] = []
  if (rights.value.value0) rightsArr.push('canPauseSwapping')
  if (rights.value.value1) rightsArr.push('canChangeSwapFee')
  if (rights.value.value2) rightsArr.push('canChangeWeights')
  if (rights.value.value3) rightsArr.push('canAddRemoveTokens')
  if (rights.value.value4) rightsArr.push('canWhitelistLPs')
  if (rights.value.value5) rightsArr.push('canChangeCap')
  return rightsArr
}
