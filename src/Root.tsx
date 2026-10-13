import React from 'react';
import {Composition, Still} from 'remotion';
import {ContactSheet, sheetSize} from './ContactSheet';
import {videos} from './videos/registry';

export const Root: React.FC = () => (
  <>
    {videos.map((v) => {
      const {width, height, fps} = v.brief.format;
      const sheet = sheetSize(v);
      return (
        <React.Fragment key={v.id}>
          <Composition
            id={v.id}
            component={v.component}
            defaultProps={{id: v.id, beats: v.beats, brand: v.brand, seed: v.brief.music.seed, withAudio: true}}
            durationInFrames={Math.round(v.beats.durationSec * fps)}
            fps={fps}
            width={width}
            height={height}
          />
          <Still id={`${v.id}-sheet`} component={ContactSheet} defaultProps={{videoId: v.id}} width={sheet.width} height={sheet.height} />
        </React.Fragment>
      );
    })}
  </>
);
