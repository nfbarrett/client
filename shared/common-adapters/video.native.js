// @flow
import * as React from 'react'
import type {Props, State} from './video'
import Box, {Box2} from './box'
import {WebView, StatusBar} from 'react-native'
import * as Styles from '../styles'
import {getVideoSize} from './video.shared'

export default class extends React.PureComponent<Props, State> {
  state = {
    containerHeight: 0,
    containerWidth: 0,
    loadedVideoSize: false,
    videoHeight: 0,
    videoWidth: 0,
  }

  _parseMessage = nativeEvent => {
    if (!nativeEvent || !nativeEvent.data) {
      return {}
    }
    try {
      const obj = JSON.parse(nativeEvent.data)
      return obj
    } catch {
      return {}
    }
  }
  _onMessage = ({nativeEvent}) => {
    const {endFullscreen, size} = this._parseMessage(nativeEvent)
    size &&
      this.setState({
        loadedVideoSize: true,
        videoHeight: size.height,
        videoWidth: size.width,
      })
    endFullscreen && StatusBar.setHidden(false)
  }
  _setContainerLayout = ({nativeEvent}) =>
    this.setState({
      containerHeight: nativeEvent.layout.height,
      containerWidth: nativeEvent.layout.width,
    })

  render() {
    const {height, width} = getVideoSize(this.state)
    return (
      <Box2
        direction="vertical"
        fullWidth={true}
        fullHeight={true}
        centerChildren={true}
        onLayout={this._setContainerLayout}
        style={this.props.style}
      >
        <Box style={getVideoSize(this.state)}>
          <WebView
            source={{html: getHTML(this.props.url)}}
            allowsInlineMediaPlayback={true}
            useWebKit={true}
            style={{
              height,
              maxHeight: height,
              maxWidth: width,
              width,
            }}
            scrollEnabled={true}
            onMessage={this._onMessage}
          />
        </Box>
      </Box2>
    )
  }
}

const getHTML = url => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0">
    <style type="text/css">
      html {
        display: block;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: ${Styles.globalColors.blue5};
      }
      body {
        display: block;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }
      video {
        margin: 0;
        position: absolute;
        height: 100%;
        width: 100%;
        max-height: 100%;
        max-width: 100%;
      }
    </style>
  </head>
  <body>
    <video id="video" autoplay preload="metadata" src="${
      // Double quote around ${url} is necessary as encodeURIComponent encodes
      // double quote but not single quote.
      url
    }" controls playsinline muted/>
    <script>
      const post = (data) =>
         window.postMessage.length !== 1
           ? setTimeout(() => post(data), 100)
           : window.postMessage(data)

      const v = document.getElementById('video')
      v.addEventListener('loadedmetadata', e => {
        post(JSON.stringify({
          size: {
            height: v.videoHeight,
            width: v.videoWidth,
          }
        }))
      })

      v.addEventListener("webkitendfullscreen", () =>
        post(JSON.stringify({ endFullscreen: true }))
      )
    </script>
  </body>
</html>
`