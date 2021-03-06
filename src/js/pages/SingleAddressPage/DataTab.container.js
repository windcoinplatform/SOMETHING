import React from 'react';
import {withRouter} from 'react-router';

import ServiceFactory from '../../services/ServiceFactory';
import Loader from '../../components/Loader';
import DataInfo from '../../components/DataInfo';

class DataTabContainer extends React.Component {
    state = {
        data: []
    };

    fetchData = () => {
        const {address, networkId} = this.props.match.params;
        const addressService = ServiceFactory.forNetwork(networkId).addressService();

        return addressService.loadData(address).then(data => this.setState({data}));
    };

    render() {
        return (
            <Loader fetchData={this.fetchData} errorTitle="Failed to load address data">
                <DataInfo data={this.state.data} />
            </Loader>
        );
    }
}

const RoutedDataTabContainer = withRouter(DataTabContainer);

export default RoutedDataTabContainer;
