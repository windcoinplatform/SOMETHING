class EventBuilder {
    constructor(categoryBuilder, eventName, properties) {
        this.categoryName = categoryBuilder.categoryName;
        this.eventName = `${this.categoryName} ${eventName}`;
        this.properties = properties;
    }

    build() {
        return {
            eventName: this.eventName,
            categoryName: this.categoryName,
            properties: this.properties
        };
    }
}

class ShowEventBuilder extends EventBuilder {
    constructor(categoryBuilder, networkId) {
        super(categoryBuilder, 'Show');

        if (networkId) {
            this.properties = {
                Network: networkId
            }
        }
    }
}

class AbstractCategoryBuilder {
    constructor(name) {
        this.categoryName = name;
    }

    events() {
        throw new TypeError('Calling abstract class method');
    };
}

class SimpleCategoryBuilder extends AbstractCategoryBuilder {
    constructor(name) {
        super(name);
    }

    events() {
        return {
            show: networkId => new ShowEventBuilder(this, networkId)
        };
    }
}

class SettingsCategoryBuilder extends AbstractCategoryBuilder {
    constructor() {
        super('Settings');
    }

    events() {
        return {
            show: networkId => new ShowEventBuilder(this, networkId),
            customSettingsApplied: nodeUrl => new EventBuilder(this, 'Custom Network Applied', {
                ['Node URL']: nodeUrl
            })
        }
    }
}

class SearchCategoryBuilder extends AbstractCategoryBuilder {
    constructor() {
        super('Search');
    }

    events() {
        return {
            results: (searchResult) => new EventBuilder(this, 'Results', {
                ['Result Type']: searchResult
            })
        }
    }
}

class AnalyticsEventBuilder {
    main() {
        return new SimpleCategoryBuilder('Main');
    }

    blocks() {
        return new SimpleCategoryBuilder('Blocks');
    }

    peers() {
        return new SimpleCategoryBuilder('Peers');
    }

    nodes() {
        return new SimpleCategoryBuilder('Nodes');
    }

    settings() {
        return new SettingsCategoryBuilder();
    }

    search() {
        return new SearchCategoryBuilder();
    }
}

export default AnalyticsEventBuilder;