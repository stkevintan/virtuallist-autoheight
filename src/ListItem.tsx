import * as React from 'react';
import Editor from '@monaco-editor/react';
import { LoremIpsum } from 'lorem-ipsum';
import { getRandomHeight, IDLE_ITEM_HEIGHT } from './util';

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4
    },
    wordsPerSentence: {
        max: 16,
        min: 4
    }
});

export interface IListItemProps {
    index: number,
    height?: number
}


export const ListItem: React.FC<IListItemProps> = ({index, height}) => {
    return (<div style={{
        height,
        padding: '20px',
        display: 'flex',
        flexFlow: 'column nowrap',
        alignItems: 'stretch',
        borderBottom: '1px solid #e8e8e8'
    }}>
        <div style={{marginBottom: 5}}># Editor : {index}</div>
        <Editor height="100%" theme="dark" language="text" value={lorem.generateParagraphs(3)} />
    </div>)
}

ListItem.defaultProps = {
    // height: getRandomHeight()
    height: IDLE_ITEM_HEIGHT
}