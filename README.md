# bootstrapnft-subgraph

Subgraph for bootstrapnft
## Config

The subgraph requires the contract address and starting block number.

This network specific config can be configured by editing `config/<network>.json`

## Scripts

#### `yarn` 
Install dependencies

#### `yarn prepare-<network>`

Generates subgraph.yaml for particular network.
Supported networks are rinkeby and mumbai.

#### `yarn codegen`

Generates AssemblyScript types for smart contract ABIs and the subgraph schema.

#### `yarn build`

Compiles the subgraph to WebAssembly.

#### `yarn create-<node>`

Create the project to the Graph Node.

#### `yarn deploy-<node>`

Deploys the subgraph to the Graph Node.

## Services

Run a local graph node

```
git clone https://github.com/graphprotocol/graph-node/
```

Update ethereum value in docker-compose.yml to `mumbai:mumbai-rpc`

```
cd graph-node/docker
```

```
docker-compose up
```

To blow away graph-node settings

```
docker-compose kill && docker-compose rm -f && rm -rf data
```