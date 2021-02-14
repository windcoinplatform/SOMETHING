import groupBy from 'lodash/groupBy';

import Alias from '../shared/Alias';
import Currency from '../shared/Currency';
import Money from '../shared/Money';
import {ApiClientService} from './ApiClientService';
import {thirdPartyApi} from '../shared/api/ThirdPartyApi';
import {VostokToWavesEnterprise} from '../shared/constants';

export class AddressService extends ApiClientService {
    constructor(transactionTransformerService, currencyService, configurationService, networkId) {
        super(configurationService, networkId);

        this.transformer = transactionTransformerService;
        this.currencyService = currencyService;
    }

    loadBalance = (address) => {
        return this.getApi().addresses.details(address).then(balanceResponse => {
            const data = balanceResponse.data;
            return {
                regular: Money.fromCoins(data.regular, Currency.SKS).toString(),
                generating: Money.fromCoins(data.generating, Currency.SKS).toString(),
                available: Money.fromCoins(data.available, Currency.SKS).toString(),
                effective: Money.fromCoins(data.effective, Currency.SKS).toString()
            };
        });
    };

    loadTransactions = (address, limit, after) => {
        return this.getApi().transactions.address(address, limit, after).then(transactionsResponse => {
            return this.transformer.transform(transactionsResponse.data[0]);
        });
    };

    loadRawAliases = (address) => {
        return this.getApi().addresses.aliases(address).then(aliasesResponse => aliasesResponse.data);
    };

    transformAndGroupAliases = (rawAliases) => {
        const lines = rawAliases.map(item => Alias.fromString(item).alias);
        const grouped = groupBy(lines, item => item.toUpperCase().charAt(0));
        return Object.keys(grouped).sort().map(letter => ({
            letter,
            aliases: grouped[letter].sort()
        }));
    };

    loadAliases = (address) => {
        return this.loadRawAliases(address).then(rawAliases => this.transformAndGroupAliases(rawAliases));
    };

    loadAssets = (address) => {
        return this.getApi().assets.balance(address).then(balanceResponse => {
            const assets = balanceResponse.data.balances.map(item => {
                // TODO: remove when token is renamed
                if (item.assetId === VostokToWavesEnterprise.id) {
                    item.issueTransaction.name = VostokToWavesEnterprise.name;
                    item.issueTransaction.description = VostokToWavesEnterprise.description;
                }

                const currency = Currency.fromIssueTransaction(item.issueTransaction);
                this.currencyService.put(currency);

                const amount = Money.fromCoins(item.balance, currency);

                return {
                    id: item.assetId,
                    name: currency.toString(),
                    amount: amount.formatAmount()
                };
            });

            return assets;
        });
    };

    loadNftTokens = (address, limit, after) => {
        return this.getApi().assets.nft(address, limit, after).then(balanceResponse => {
            const tokens = balanceResponse.data.map(item => {
                return {
                    id: item.id,
                    name: item.name,
                };
            });

            return tokens;
        });
    };

    loadData = (address) => {
        return this.getApi().addresses.data(address).then(dataResponse => dataResponse.data);
    };

    loadScript = (address) => {
        return this.getApi().addresses.script(address).then(scriptResponse => scriptResponse.data);
    };

    validate = (address) => {
        return this.getApi().addresses.validate(address).then(validateResponse => validateResponse.data.valid);
    };

    decompileScript = (scriptBase64) => {
        const config = this.configuration();
        const api = thirdPartyApi(config.spamListUrl, this.configurationService.getDecompileScriptUrl());

        return api.decompileScript(scriptBase64).then(decompileResponse => decompileResponse.data.script);
    };
}
