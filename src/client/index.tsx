// tslint:disable-next-line:no-unused-variable
import { Provider } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Routes } from 'routing';
import { IRenderedStates, Store, useStore } from 'stores';
import { AppContainer } from 'views';
import './styles';

// These are the vars we stashed on the window
// Use Fusebox to pull them in dynamically
const states: IRenderedStates = require('~/rendered/state.js');

if (states.stores.router) {
    states.stores.router.client = true;
}

const routerState = states.stores.router;

if (routerState) {
    routerState.finishedFirstLoad = false;
    routerState.routes = Routes();
    routerState.config.type = 'browser';
    routerState.config.disableInitialRoute = true;
}

const store = new Store(states.stores);
useStore(store);

store.domains.router.init();

async function renderApp() {
    const app = (
        <Provider {...store.domains}>
            <AppContainer />
        </Provider>
    );

    ReactDOM.render(app, document.getElementById('app'));
}

renderApp();

// Custom HMR, will forcefully reload if you edit a store file or
// one listed under fullPaths - Keeps state in sync
import { setStatefulModules } from 'fuse-box/modules/fuse-hmr';

setStatefulModules((name) => {
    return /stores/.test(name) || /client\/index/.test(name);
});
