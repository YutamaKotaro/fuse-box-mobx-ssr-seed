import { lazyLoad } from 'fuse-tools';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Component } from 'react';
import bundleCache, { IAsyncRoutes } from 'routing/async';
import { IStores } from 'stores';

export interface IRouteProps {
    path: string | string[];
    component?: React.SFC<any | void> | React.ComponentClass<any | void>;
    asyncComponent?: IAsyncRoutes;
    router?: IStores['router'];
}

// For async comps
interface IRouteState {
    AsyncComponent: any;
}

@inject((stores: IStores) => ({
    router: stores.router,
}))
@observer
export class Route extends Component<IRouteProps, IRouteState> {
    constructor() {
        super();
        this.state = {
            AsyncComponent: undefined,
        };
    }

    public componentWillReceiveProps(nextProps: IRouteProps) {
        const { asyncComponent, path, router } = nextProps;
        if (!asyncComponent || !this.isMatch(path, router)) {
            return;
        }

        this.lazyLoad(asyncComponent);
    }

    public componentWillMount() {
        const { asyncComponent, path, router } = this.props;
        if (!asyncComponent || !this.isMatch(path, router)) {
            return;
        }

        this.lazyLoad(asyncComponent);
    }

    public render() {
        const { router, path, component: Component, asyncComponent } = this.props;

        if (!router) {
            console.warn('No router configured');
            return null;
        }

        if (!this.isMatch(path, router)) {
            return null;
        }

        if (this.shouldShowLoader()) {
            return <span>Loading...</span>;
        }

        if (Component) {
            return <Component />;
        }

        if (!asyncComponent) {
            console.warn('Route must have either a component or async component specified.');
            return null;
        }

        const { AsyncComponent } = this.state;
        if (!this.state.AsyncComponent) {
            return null;
        }

        return <AsyncComponent /> || null;
    }

    private isMatch(path: string | string[], router?: IStores['router']) {
        if (!router) {
            return false;
        }

        if (typeof path === 'string') {
            return path === router.route;
        }

        if (!router.route) {
            return false;
        }

        return path.indexOf(router.route) !== -1;
    }

    private shouldShowLoader() {
        const { path, router } = this.props;
        if (!router || !router.route) {
            return false;
        }

        // Don't show if no transition is happening
        if (!router.isTransitioning || !router.finishedFirstLoad) {
            return false;
        }

        // if the path matches directly
        // show the loading icon
        if (typeof path === 'string') {
            return path === router.route;
        }

        // If array of paths, dont show loading icon if the last
        // route was one we  render for. i.e. - if we are transitioning between
        // sub routes, no need to show loading icon here.
        if (router.lastRoute && path.indexOf(router.lastRoute) !== -1) {
            return false;
        }

        // finally, if the route is in our array, show the loading icon
        return path.indexOf(router.route) !== -1;
    }

    private lazyLoad(name: IAsyncRoutes) {
        const bundle = bundleCache.getBundle(name);
        if (bundle) {
            this.setState({ AsyncComponent: bundle.default });
            return;
        }
        this.lazyLoadAsync(name);
    }

    private async lazyLoadAsync(name: string) {
        const { router, path } = this.props;
        if (!router) {
            return;
        }
        const bundle = await lazyLoad(name);
        console.log(name, bundle);
        this.setState({ AsyncComponent: bundle.default });
    }
};