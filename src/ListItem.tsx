import * as React from 'react';
import Editor from '@monaco-editor/react';
import { LoremIpsum } from 'lorem-ipsum';

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
    height: number
}


export const ListItem: React.FC<IListItemProps> = ({ index, height: pHeight }) => {
    const [height, setHeight] = React.useState(pHeight);
    return (<div style={{
        height: height,
        padding: '20px',
        display: 'flex',
        flexFlow: 'column nowrap',
        alignItems: 'stretch',
        borderBottom: '1px solid #e8e8e8',
        overflow: 'hidden'
    }}>
        <div style={{ marginBottom: 5 }}># Editor : {index}</div>
        <label style={{ display: 'flex', marginBottom: 10 }}>
            <span>Change the item height: </span>{' '}
            <input value={height} onChange={e => setHeight(parseInt(e.target.value ?? 0, 10))} type="number" />
        </label>
        <Editor theme="dark" language="text" value={lorem.generateParagraphs(3)} />
    </div>)
}
