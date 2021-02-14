import Currency from '../shared/Currency';
import Money from '../shared/Money';
import OrderPrice from '../shared/OrderPrice';
import DateTime from '../shared/DateTime';
import {libs} from '@waves/signature-generator';

const transformMultiple = (currencyService, spamDetectionService, stateChangeService, transactions) => {
    const promises = transactions.map(item => transform(currencyService,
        spamDetectionService, stateChangeService, item, false));

    return Promise.all(promises);
};

const transformSingle = (currencyService, spamDetectionService, stateChangeService, tx) => {
    return transform(currencyService, spamDetectionService, stateChangeService, tx, true);
};

const transform = (currencyService, spamDetectionService, stateChangeService, tx, shouldLoadDetails) => {
    switch (tx.type) {
        case 1:
            return transformGenesis(currencyService, tx);

        case 2:
        case 4:
            return transformTransfer(currencyService, spamDetectionService, tx);

        case 3:
            return transformIssue(currencyService, tx);

        case 5:
            return transformReissue(currencyService, tx);

        case 6:
            return transformBurn(currencyService, tx);

        case 7:
            return transformExchange(currencyService, tx);

        case 8:
            return transformLease(currencyService, tx);

        case 9:
            return transformLeaseCancel(currencyService, tx);

        case 10:
            return transformAlias(currencyService, tx);

        case 11:
            return transformMassTransfer(currencyService, spamDetectionService, tx);

        case 12:
            return transformData(currencyService, tx);

        case 13:
            return transformScript(currencyService, tx);

        case 14:
            return transformSponsorship(currencyService, tx);

        case 15:
            return transformAssetScript(currencyService, tx);

        case 16:
            return transformScriptInvocation(currencyService, stateChangeService, tx, shouldLoadDetails);

        default:
            return Promise.resolve(Object.assign({}, tx));
    }
};

const DEFAULT_FUNCTION_CALL = {
    function: 'default',
    args: []
};

const attachmentToString = (attachment) => {
    if (!attachment)
        return '';

    const bytes = libs.base58.decode(attachment);
    let result = '';
    try {
        result = libs.converters.byteArrayToString(bytes);
    } catch (e) {
        // do nothing
    }

    return result;
};

const copyMandatoryAttributes = tx => {
    let proofs = tx.proofs;

    if (!proofs || proofs.length === 0) {
        proofs = [tx.signature];
    }

    return {
        id: tx.id,
        type: tx.type,
        version: tx.version,
        timestamp: new DateTime(tx.timestamp),
        sender: tx.sender,
        senderPublicKey: tx.senderPublicKey,
        height: tx.height,
        proofs
    };
};

const loadAmountAndFeeCurrencies = (currencyService, amountAssetId, feeAssetId) => {
    return Promise.all([
        currencyService.get(amountAssetId),
        currencyService.get(feeAssetId)
    ]);
};

const transformScriptInvocation = (currencyService, stateChangeService, tx, shouldLoadDetails) => {
    return currencyService.get(tx.feeAssetId).then(feeCurrency => {
        const promise = tx.payment && tx.payment.length > 0
            ? currencyService.get(tx.payment[0].assetId)
                .then(currency => Money.fromCoins(tx.payment[0].amount, currency))
            : Promise.resolve(null);

        return promise.then(payment => {
            const result = Object.assign(copyMandatoryAttributes(tx), {
                dappAddress: tx.dApp,
                call: tx.call || DEFAULT_FUNCTION_CALL,
                payment,
                fee: Money.fromCoins(tx.fee, feeCurrency)
            });

            if (!shouldLoadDetails)
                return result;

            return stateChangeService.loadStateChanges(tx.id).then(changes => {
                result.stateChanges = changes.stateChanges;

                return result;
            }).catch(() => result);
        });
    });
};

const transformAssetScript = (currencyService, tx) => {
    return currencyService.get(tx.assetId).then(asset => {
        return Object.assign(copyMandatoryAttributes(tx), {
            script: tx.script,
            asset,
            fee: Money.fromCoins(tx.fee, Currency.SKS)
        })
    });
};

const transformData = (currencyService, tx) => {
    return currencyService.get(tx.feeAssetId).then(feeCurrency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            data: tx.data,
            fee: Money.fromCoins(tx.fee, feeCurrency)
        })
    });
};

const transformScript = (currencyService, tx) => {
    return currencyService.get(tx.feeAssetId).then(feeCurrency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            script: tx.script,
            fee: Money.fromCoins(tx.fee, feeCurrency)
        })
    });
};

const transformSponsorship = (currencyService, tx) => {
    return loadAmountAndFeeCurrencies(currencyService, tx.assetId, tx.feeAssetId).then(pair => {
        const sponsoredCurrency = pair[0];
        const feeCurrency = pair[1];

        const sponsoredFee = tx.minSponsoredAssetFee ?
            Money.fromCoins(tx.minSponsoredAssetFee, sponsoredCurrency) :
            null;

        return Object.assign(copyMandatoryAttributes(tx), {
            fee: Money.fromCoins(tx.fee, feeCurrency),
            sponsoredFee
        });
    });
};

const transformMassTransfer = (currencyService, spamDetectionService, tx) => {
    return loadAmountAndFeeCurrencies(currencyService, tx.assetId, tx.feeAssetId).then(pair => {
        const amountCurrency = pair[0];
        const feeCurrency = pair[1];

        const transfers = tx.transfers.map(item => ({
            recipient: item.recipient,
            amount: Money.fromCoins(item.amount, amountCurrency)
        }));

        return Object.assign(copyMandatoryAttributes(tx), {
            fee: Money.fromCoins(tx.fee, feeCurrency),
            attachment: attachmentToString(tx.attachment),
            totalAmount: Money.fromCoins(tx.totalAmount, amountCurrency),
            transferCount: tx.transferCount,
            isSpam: spamDetectionService.isSpam(tx.assetId),
            transfers
        });
    });
};

const transformAlias = (currencyService, tx) => {
    return Promise.resolve(
        Object.assign(copyMandatoryAttributes(tx), {
            fee: Money.fromCoins(tx.fee, Currency.SKS),
            alias: tx.alias
        })
    );
};

const transformLease = (currencyService, tx) => {
    return currencyService.get(tx.feeAssetId).then(feeCurrency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            recipient: tx.recipient,
            fee: Money.fromCoins(tx.fee, feeCurrency),
            amount: Money.fromCoins(tx.amount, Currency.SKS),
            status: tx.status
        })
    });
};

const transformLeaseCancel = (currencyService, tx) => {
    return currencyService.get(tx.feeAssetId).then(feeCurrency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            fee: Money.fromCoins(tx.fee, feeCurrency),
            leaseId: tx.leaseId,
            recipient: tx.lease ? tx.lease.recipient : null
        });
    });
};

const transformExchange = (currencyService, tx) => {
    const buyOrder = tx.order1.orderType === 'buy' ? tx.order1 : tx.order2;
    const sellOrder = tx.order2.orderType === 'sell' ? tx.order2 : tx.order1;
    const assetPair = buyOrder.assetPair;

    return Promise.all([
        currencyService.get(assetPair.amountAsset),
        currencyService.get(assetPair.priceAsset),
        currencyService.get(tx.feeAssetId),
        currencyService.get(buyOrder.matcherFeeAssetId),
        currencyService.get(sellOrder.matcherFeeAssetId)
    ]).then(tuple => {
        const currencyPair = {
            amountAsset: tuple[0],
            priceAsset: tuple[1]
        };

        const feeAsset = tuple[2];
        const buyFeeAsset = tuple[3];
        const sellFeeAsset = tuple[4];
        const price = OrderPrice.fromBackendPrice(tx.price, currencyPair);
        const amount = Money.fromCoins(tx.amount, currencyPair.amountAsset);

        return Object.assign(copyMandatoryAttributes(tx), {
            fee: Money.fromCoins(tx.fee, feeAsset),
            buyFee: Money.fromCoins(tx.buyMatcherFee, buyFeeAsset),
            sellFee: Money.fromCoins(tx.sellMatcherFee, sellFeeAsset),
            price,
            amount,
            total: price.volume(amount),
            buyOrder: transformOrder(buyOrder, currencyPair, buyFeeAsset),
            sellOrder: transformOrder(sellOrder, currencyPair, sellFeeAsset),
            seller: sellOrder.sender,
            buyer: buyOrder.sender
        });
    });
};

const transformOrder = (order, assetPair, feeAsset) => {
    return {
        id: order.id,
        sender: order.sender,
        assetPair,
        orderType: order.orderType,
        amount: Money.fromCoins(order.amount, assetPair.amountAsset),
        price: OrderPrice.fromBackendPrice(order.price, assetPair),
        timestamp: new DateTime(order.timestamp),
        expiration: new DateTime(order.expiration),
        fee: Money.fromCoins(order.matcherFee, feeAsset)
    };
};

const transformBurn = (currencyService, tx) => {
    return currencyService.get(tx.assetId).then(currency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            amount: Money.fromCoins(tx.amount, currency),
            fee: Money.fromCoins(tx.fee, Currency.SKS)
        });
    });
};

const transformReissue = (currencyService, tx) => {
    return currencyService.get(tx.assetId).then(currency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            amount: Money.fromCoins(tx.quantity, currency),
            fee: Money.fromCoins(tx.fee, Currency.SKS),
            reissuable: tx.reissuable,

        });
    });
};

const transformIssue = (currencyService, tx) => {
    const c = Currency.fromIssueTransaction(tx);
    currencyService.put(c);

    return currencyService.get(c.id).then(currency => {
        return Object.assign(copyMandatoryAttributes(tx), {
            amount: Money.fromCoins(tx.quantity, currency),
            fee: Money.fromCoins(tx.fee, Currency.SKS),
            name: tx.name,
            reissuable: tx.reissuable,
            decimals: tx.decimals,
            description: tx.description,
            script: tx.script
        });
    });
};

const transformTransfer = (currencyService, spamDetectionService, tx) => {
    return loadAmountAndFeeCurrencies(currencyService, tx.assetId, tx.feeAssetId).then(pair => {
        const amountCurrency = pair[0];
        const feeCurrency = pair[1];

        return Object.assign(copyMandatoryAttributes(tx), {
            amount: Money.fromCoins(tx.amount, amountCurrency),
            fee: Money.fromCoins(tx.fee, feeCurrency),
            attachment: attachmentToString(tx.attachment),
            recipient: tx.recipient,
            isSpam: spamDetectionService.isSpam(tx.assetId)
        });
    });
};

const transformGenesis = (currencyService, tx) => {
    const amount = Money.fromCoins(tx.amount, Currency.SKS);
    const fee = Money.fromCoins(tx.fee, Currency.SKS);

    return Object.assign(copyMandatoryAttributes(tx), {
        amount,
        fee,
        recipient: tx.recipient,
        height: 1
    });
};

export class TransactionTransformerService {
    constructor(currencyService, spamDetectionService, stateChangeService) {
        this.currencyService = currencyService;
        this.spamDetectionService = spamDetectionService;
        this.stateChangeService = stateChangeService;
    }

    transform = (input) => {
        if (Array.isArray(input))
            return transformMultiple(this.currencyService,
                this.spamDetectionService, this.stateChangeService, input);

        return transformSingle(this.currencyService,
            this.spamDetectionService, this.stateChangeService, input);
    };
}
