# bootstrapnft-subgraph

Subgraph for bootstrapnft
## Config

The subgraph requires only the VaultFactoryUpgradable contract address and starting block number.

This network specific config can be configured by editing `config/<network>.json`

## Scripts

#### `yarn auth`

```sh
GRAPH_ACCESS_TOKEN=<access-token> yarn auth
```

#### `yarn prepare-<network>`

Generates subgraph.yaml for particular network.
Supported networks are rinkeby and mainnet.

#### `yarn codegen`

Generates AssemblyScript types for smart contract ABIs and the subgraph schema.

#### `yarn build`

Compiles the subgraph to WebAssembly.

#### `yarn deploy-<network>`

Deploys the subgraph for particular network to the official Graph Node.<br/>
