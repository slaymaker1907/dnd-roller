import * as ReactDOM from "react-dom";
import * as React from "react";
import { connect, Provider, MapDispatchToProps } from "react-redux";
import { createStore } from "redux";

import Button from "material-ui/Button";
// import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import TextField from "material-ui/TextField";
// import SelectField from "material-ui/SelectField";
// import MenuItem from "material-ui/MenuItem";
// import RaisedButton from "material-ui/RaisedButton";
import Checkbox from "material-ui/Checkbox";
import { FormControlLabel, FormGroup } from "material-ui/Form";

interface RollDescription {
    id: number;
    diceType: number;
    diceCount: number;
    bonus: number;
    critx: number;
    isCrit: boolean;
    result?: number[];
}

interface RollConfigProps extends RollDescription {
    updateRoll: (update: UpdateRollAction) => void;
    rollDice: () => void;
    remove: () => void;
}

function NumberField(props: { hint: string, value?: number, onChange: (ele: any) => void }) {
    return <TextField style={{flex: "1 1 0"}} onChange={props.onChange} type="number" helperText={props.hint} value={props.value} />;
}

let RollConfig: any = (props: RollConfigProps) => {
    let resultText = null;
    if (props.result) {
        const bonus = props.isCrit ? props.bonus * props.critx : props.bonus;
        const sum = props.result.reduce((a, b) => a + b, 0) + bonus;
        resultText = (
            <p>
                Roll: {props.result.join(" + ")} + <b>{bonus}</b> = {sum}
            </p>
        );
    } else {
        resultText = <p>Click roll button for new roll.</p>;
    }

    const changeHelper = (attrName: string) => {
        return (event: any) => {
            let text = event.target.value;
            if (!isNaN(text)) {
                text = parseInt(text);
            }

            props.updateRoll({
                type: UPDATE_ROLL_TYPE,
                [attrName]: text
            });
        };
    };
    const critChange = () => {
        props.updateRoll({
            type: UPDATE_ROLL_TYPE,
            isCrit: !props.isCrit
        });
    };
    return (
        // <div style={{display: 'flex', flexDirection: 'row'}}>
        <div>
            <FormGroup row style={{display: "flex"}}>
                <Button color="primary" variant="raised" onClick={props.rollDice}>Roll</Button>
                <NumberField hint="Dice count" value={props.diceCount} onChange={changeHelper("diceCount")} />
                <NumberField hint="Dice type" value={props.diceType} onChange={changeHelper("diceType")} />
                <NumberField hint="Bonus" value={props.bonus} onChange={changeHelper("bonus")} />
                <NumberField hint="Critx" value={props.critx} onChange={changeHelper("critx")} />
                <FormControlLabel control={<Checkbox checked={props.isCrit} />} label="Crit?" onClick={critChange} />
                <Button color="secondary" variant="raised" onClick={props.remove}>Delete</Button>
            </FormGroup>
            {resultText}
        </div>
    );
};
RollConfig = connect(undefined, (dispatch, ownProps: RollDescription) => {
    return {
        updateRoll: (update: UpdateRollAction) => dispatch({
            rollId: ownProps.id,
            ...update
        }),
        rollDice: () => dispatch({
            type: UPDATE_ROLL_TYPE,
            rollId: ownProps.id,
            roll: true
        }),
        remove: () => dispatch({
            type: UPDATE_ROLL_TYPE,
            rollId: ownProps.id,
            remove: true
        })
    };
})(RollConfig);

interface AppState {
    diceRolls: RollDescription[];
}

interface DiceRollsProps extends AppState {
    addRoll: () => void;
}

const mapAddRoll: MapDispatchToProps<any, DiceRollsProps> = (dispatch: any) => {
    const startRoll: UpdateRollAction = {
        type: UPDATE_ROLL_TYPE,
        ...DEFAULT_ROLL
    } as any;
    return {
        addRoll: () => dispatch(startRoll)
    };
};

const DiceRolls: any = connect((state: AppState) => state, mapAddRoll)((props: DiceRollsProps) => {
    return (
        <div>
            {props.diceRolls.map(roll => <RollConfig {...roll} key={roll.id} />)}
            <Button variant="raised" onClick={props.addRoll}  >New roll</Button>
        </div>
    );
});

interface UpdateRollAction {
    type: string;
    rollId?: number;
    diceCount?: number;
    diceType?: number;
    bonus?: number;
    isCrit?: boolean;
    critx?: number;
    remove?: boolean;
    roll?: boolean;
}

// Technically could never halt, but won't take too long in practice.
function rollSecureDice(maxValue: number) {
    const buffer = new Uint32Array(1);
    const safeMax = Math.floor(Math.pow(2, 32) / maxValue) * maxValue; // This gives a strict upper bound (non-inclusive) to ensure uniform distribution.

    while (true) {
        window.crypto.getRandomValues(buffer);
        const result = buffer[0];
        if (result < safeMax) {
            return result % maxValue + 1; // Mod is safe since result is < safeMax. Add 1 since zero based.
        }
    }
}

let CurrentMaxId = 1;
const UPDATE_ROLL_TYPE = "UPDATE_ROLL_TYPE";
const DEFAULT_ROLL: RollDescription = {
    id: 0,
    diceType: 6,
    diceCount: 1,
    bonus: 0,
    critx: 2,
    isCrit: false
};
function reducer(state: AppState, action: UpdateRollAction): AppState {
    if (!state) state = {
        diceRolls: [
            {
                ...DEFAULT_ROLL,
                id: CurrentMaxId++
            }
        ]
    };


    if (action.type !== UPDATE_ROLL_TYPE) {
        return state;
    }

    const actionAsRoll: any = {
        ...action
    };
    delete (actionAsRoll as any).remove;
    delete (actionAsRoll as any).rollId;

    if (!action.rollId) {
        const newRoll: RollConfigProps = {
            ...actionAsRoll,
            id: CurrentMaxId++,
            isCrit: action.isCrit!! // Double !! to make a boolean.
        };

        const newRolls = state.diceRolls.concat(newRoll);
        return {
            diceRolls: newRolls
        };
    } else if (action.remove) {
        const newRolls = state.diceRolls.filter(roll => roll.id !== action.rollId);
        return {
            diceRolls: newRolls
        };
    } else if (action.roll) {
        const index = state.diceRolls.findIndex(roll => roll.id === action.rollId);
        const newRolls = state.diceRolls.concat();
        const oldRoll = state.diceRolls[index];
        const rollResult: number[] = [];

        let rollCount = oldRoll.diceCount;
        if (oldRoll.isCrit) rollCount *= oldRoll.critx;
        for (let i = 0; i < rollCount; i++) {
            rollResult.push(rollSecureDice(oldRoll.diceType));
        }

        newRolls[index] = Object.assign({}, oldRoll, {
            result: rollResult
        });
        return {
            diceRolls: newRolls
        };
    } else {
        const index = state.diceRolls.findIndex(roll => roll.id === action.rollId);
        const newRolls = state.diceRolls.concat();
        newRolls[index] = Object.assign({}, newRolls[index], actionAsRoll);
        delete newRolls[index].result;
        return {
            diceRolls: newRolls,
        };
    }
}

const store = createStore(reducer as any);
function Main() {
    return (
        <Provider store={store}>
            <DiceRolls />
        </Provider>
    );
}

ReactDOM.render(<Main />, document.getElementById("app"));
