import * as React from 'react';
import Editor from '@monaco-editor/react';
import { LoremIpsum } from 'lorem-ipsum';

const heightCache: Record<number, number> = {};

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4
    },
    wordsPerSentence: {
        max: 3,
        min: 2
    }
});


const code = () => `
// Demo here
while(true) {
    console.log('${lorem.generateSentences(1)}');
}
`.trim();

export interface IListItemProps {
    index: number,
    height: number
}

export const ListItem: React.FC<IListItemProps> = ({ index, height: pHeight }) => {
    const [height, setHeight] = React.useState(heightCache[index] || pHeight);
    const value = React.useMemo(() => code(), []);
    return (<div style={{ height: height }} className="list-item">
        <div className="list-item-header"># Editor : {index + 1}</div>
        <label style={{ display: 'flex',alignItems:'center', marginBottom: 10 }}>
            <small>Change the row height: &nbsp;</small>
            <input value={height} onChange={e => {
                const height = parseInt(e.target.value ?? 0, 10);
                heightCache[index] = height; 
                setHeight(height);
            }} type="number" />
        </label>
        <div style={{ flex: '1 1 auto', overflow: 'hidden', border: '1px solid #ccc'}}>
            <Editor 
            theme="light" 
            language="typescript" 
            value={value} 
            options={{
                minimap: { enabled: false },
            }} 
            />
        </div>
    </div>)
}
