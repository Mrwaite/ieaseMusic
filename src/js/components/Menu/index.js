
import React, { Component } from 'react';
import { Link } from 'react-router';
import { remote } from 'electron';
import { inject, observer } from 'mobx-react';
import injectSheet from 'react-jss';
import clazz from 'classname';

import classes from './classes';
import FadeImage from 'ui/FadeImage';

@inject(stores => ({
    show: stores.menu.show,
    hasLogin: stores.me.hasLogin,
    profile: stores.me.profile,
    logout: stores.me.logout,
    close: () => stores.menu.toggle(false),
    showSearch: () => stores.search.toggle(true),
}))
@observer
class Menu extends Component {
    doLogout() {
        // Clear cookies
        remote.getCurrentWindow().webContents.session.clearStorageData();
        this.props.logout();
    }

    renderMe() {
        var { classes, close, hasLogin, profile } = this.props;
        var link = `/user/${profile.userId}`;

        if (!hasLogin()) {
            return (
                <p>
                    <Link
                        onClick={close}
                        to="/login/0">
                        Sign in
                    </Link>
                </p>
            );
        }

        return (
            <artist className={classes.profile}>
                <Link
                    className="clearfix"
                    onClick={close}
                    to={link}>
                    <FadeImage src={profile.avatarUrl} />
                </Link>

                <div className={classes.info}>
                    <p
                        className={classes.username}
                        onClick={close}
                        title={profile.nickname}>
                        <Link to={link}>{profile.nickname}</Link>
                    </p>
                    <a
                        className={classes.logout}
                        href=""
                        onClick={e => this.doLogout()}>
                        Logout
                    </a>
                </div>
            </artist>
        );
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.show === true) {
            setTimeout(() => {
                this.refs.container.focus();
            });
        }
    }

    render() {
        var { classes, show, close, showSearch } = this.props;

        if (!show) {
            return false;
        }

        return (
            <div
                className={classes.container}
                // Press ESC close menu
                onKeyUp={e => e.keyCode === 27 && this.props.close()}
                ref="container"
                tabIndex="-1">
                <div
                    className={classes.overlay}
                    onClick={this.props.close} />
                <section className={classes.body}>
                    <img
                        alt="Close Menus"
                        className={classes.close}
                        onClick={close}
                        src="assets/close.png" />

                    <div>
                        {
                            this.renderMe()
                        }

                        <div className={classes.navs}>
                            <p>
                                <Link
                                    onClick={close}
                                    to="/">
                                    Home
                                </Link>
                            </p>
                            <p>
                                <Link
                                    onClick={() => {
                                        showSearch();
                                        close();
                                    }}>
                                    Search
                                </Link>
                            </p>
                            <p>
                                <Link
                                    onClick={close}
                                    to="/playlist/全部">
                                    Playlist
                                </Link>
                            </p>
                            <p>
                                <Link
                                    onClick={close}
                                    to="/top">
                                    Top
                                </Link>
                            </p>

                            <p>
                                <Link
                                    onClick={close}
                                    to="/fm">
                                    My FM
                                </Link>
                            </p>
                        </div>
                    </div>

                </section>
            </div>
        );
    }
}

export default injectSheet(classes)(Menu);
