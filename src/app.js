
import React, { Component } from 'react';
import { render } from 'react-dom';
import { Router, hashHistory } from 'react-router';
import { Provider } from 'mobx-react';
import { ipcRenderer, remote, shell } from 'electron';
import { ThemeProvider } from 'react-jss';
import 'ionicons201/css/ionicons.css';

import './global.css';
import 'utils/albumColors';
import { PLAYER_REPEAT, PLAYER_SHUFFLE, PLAYER_LOOP } from 'stores/controller';
import theme from './theme';
import getRoutes from './js/routes';
import stores from './js/stores';

class App extends Component {
    componentDidMount() {
        var { controller, fm, me, menu, playing, search, comments, lyrics } = stores;
        var navigator = this.refs.navigator;
        var isFMPlaying = () => controller.playlist.id === fm.playlist.id;

        // Player play
        ipcRenderer.on('player-play', (e, args) => {
            controller.play(args.id);
        });

        // Toggle the player
        ipcRenderer.on('player-toggle', () => {
            // Ignore signal
            if (search.show || playing.show) {
                return;
            }

            controller.toggle();
        });

        // Pause the player when system suspend
        ipcRenderer.on('player-pause', () => {
            if (controller.playing) {
                controller.toggle();
            }
        });

        // Play the next song
        ipcRenderer.on('player-next', () => {
            let FMPlaying = isFMPlaying();

            if (FMPlaying) {
                fm.next();
            } else {
                controller.next();
            }
        });

        // Play previous song
        ipcRenderer.on('player-previous', () => {
            controller.prev();
        });

        // Like a song
        ipcRenderer.on('player-like', () => {
            var song = controller.song;

            if (me.likes.get(song.id)) {
                return;
            }

            me.like(controller.song);
        });

        // Go the home screen
        ipcRenderer.on('show-home', () => {
            navigator.router.push('/');
        });

        // Search
        ipcRenderer.on('show-search', () => {
            search.toggle(true);
        });

        // Show the Ranking list
        ipcRenderer.on('show-top', () => {
            navigator.router.push('/top');
        });

        // All playlists
        ipcRenderer.on('show-playlist', () => {
            navigator.router.push('/playlist/全部');
        });

        // Show personal FM channel
        ipcRenderer.on('show-fm', () => {
            navigator.router.push('/fm');
        });

        // Show preferences screen
        ipcRenderer.on('show-preferences', () => {
            navigator.router.push('/preferences');
        });

        // SHow slide menu panel
        ipcRenderer.on('show-menu', () => {
            menu.toggle(true);
        });

        // Show the next up
        ipcRenderer.on('show-playing', () => {
            playing.toggle(true);
        });

        // Right click menu
        window.addEventListener('contextmenu', e => {
            let logined = me.hasLogin();
            let contextmenu = new remote.Menu.buildFromTemplate([
                {
                    label: controller.playing ? 'Pause' : 'Play',
                    click: () => {
                        controller.toggle();
                    }
                },
                {
                    label: '下一首',
                    click: () => {
                        isFMPlaying() ? fm.next() : controller.next();
                    }
                },
                {
                    label: '上一首',
                    click: () => {
                        controller.prev();
                    }
                },
                {
                    type: 'separator',
                },
                {
                    label: 'Preferences...',
                    click: () => {
                        navigator.router.push('/preferences');
                    },
                },
                {
                    type: 'separator',
                },
                {
                    label: '评论',
                    click: () => {
                        comments.toggle(true);
                    }
                },
                {
                    label: '歌词',
                    click: () => {
                        lyrics.toggle(true);
                    }
                },
            ]);

            contextmenu.popup(remote.getCurrentWindow(), {
                async: true,
            });
        });
    }

    render() {
        return (
            <Provider {...stores}>
                <Router
                    history={hashHistory}
                    ref="navigator">
                    {getRoutes()}
                </Router>
            </Provider>
        );
    }
}

render(
    <ThemeProvider theme={theme}>
        <App />
    </ThemeProvider>,
    document.getElementById('root')
);
