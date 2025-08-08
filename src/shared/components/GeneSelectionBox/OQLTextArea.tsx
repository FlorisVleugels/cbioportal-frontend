import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import styles from './styles.module.scss';
import queryStoreStyles from '../../components/query/styles/styles.module.scss';
import {
    observable,
    computed,
    action,
    reaction,
    IReactionDisposer,
    makeObservable,
} from 'mobx';
import { Gene } from 'cbioportal-ts-api-client';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {
    GeneReplacement,
    Focus,
    normalizeQuery,
    QueryStore,
} from 'shared/components/query/QueryStore';
import {
    getEmptyGeneValidationResult,
    getFocusOutText,
    getOQL,
} from './GeneSelectionBoxUtils';
import GeneSymbolValidator, {
    GeneValidationResult,
} from './GeneSymbolValidator';
import autobind from 'autobind-decorator';
import bind from 'bind-decorator';
import { createQueryStore } from '../../lib/createQueryStore';
import { FlexCol } from '../flexbox/FlexBox';

export interface IGeneSelectionBoxProps {
    submitButton?: JSX.Element;
    error?: string;
    messages?: string[];

    focus?: Focus;
    inputGeneQuery?: string;
    validateInputGeneQuery?: boolean;
    location?: GeneBoxType;
    textBoxPrompt?: string;
    callback?: (
        oql: {
            query: SingleGeneQuery[];
            error?: { start: number; end: number; message: string };
        },
        genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string
    ) => void;
    textAreaHeight?: string;
}

export enum GeneBoxType {
    DEFAULT,
    STUDY_VIEW_PAGE,
    ONCOPRINT_HEATMAP,
}

export type OQL = {
    query: SingleGeneQuery[];
    error?: { start: number; end: number; message: string };
};

@observer
export default class OQLTextArea extends React.Component<
    IGeneSelectionBoxProps,
    {}
> {
    private disposers: IReactionDisposer[];

    // Need to record the textarea value due to SyntheticEvent restriction due to debounce
    private currentTextAreaValue = '';

    @observable private _geneQueryStr = '';
    @computed get geneQueryStr() {
        if (this.queryStore) {
            return this.queryStore.geneQuery;
        } else {
            return this._geneQueryStr;
        }
    }
    set geneQueryStr(q: string) {
        if (this.queryStore) {
            this.queryStore.geneQuery = q;
        } else {
            this._geneQueryStr = q;
        }
    }
    @observable private geneQueryIsValid = true;
    @observable private queryToBeValidated = '';
    @observable private isFocused = false;
    @observable private skipGenesValidation = false;
    @observable private showComment = true;
    private queryStore: QueryStore | undefined;

    private readonly textAreaRef: React.RefObject<HTMLTextAreaElement>;
    private updateQueryToBeValidateDebounce = _.debounce(() => {
        this.queryToBeValidated = this.currentTextAreaValue;
        this.skipGenesValidation = false;

        // When the text is empty, it will be skipped from oql and further no validation will be done.
        // Need to set the geneQuery here
        if (this.currentTextAreaValue === '') {
            this.geneQueryStr = '';
            if (this.props.callback) {
                this.props.callback(
                    getOQL(''),
                    getEmptyGeneValidationResult(),
                    this.geneQueryStr
                );
            }
        }
    }, 500);

    public static defaultProps = {
        validateInputGeneQuery: true,
    };

    constructor(props: IGeneSelectionBoxProps) {
        super(props);
        makeObservable(this);
        this.geneQueryStr = this.props.inputGeneQuery || '';
        this.queryToBeValidated = this.geneQueryStr;
        if (!this.props.validateInputGeneQuery) {
            this.skipGenesValidation = true;
        }
        this.textAreaRef = React.createRef<HTMLTextAreaElement>();
    }

    componentDidMount(): void {
        this.disposers = [
            reaction(
                () => this.props.inputGeneQuery,
                inputGeneQuery => {
                    if (
                        (inputGeneQuery || '').toUpperCase() !==
                        this.geneQueryStr.toUpperCase()
                    ) {
                        if (!this.props.validateInputGeneQuery) {
                            this.skipGenesValidation = true;
                        }
                        this.geneQueryStr = (inputGeneQuery || '').trim();
                        this.queryToBeValidated = this.geneQueryStr;
                    }
                    this.updateTextAreaRefValue();
                }
            ),
            reaction(
                () => this.showFullText,
                () => {
                    this.updateTextAreaRefValue();
                }
            ),
        ];
    }

    componentWillUnmount(): void {
        for (const disposer of this.disposers) {
            disposer();
        }
    }

    @action.bound
    private updateGeneQuery(value: string) {
        this.geneQueryStr = value;
        // at the time gene query is updated, the queryToBeValidated should be set to the same
        this.queryToBeValidated = value;

        // You want to keep the box open when the gene symbol validator tries to correct your gene query
        this.isFocused = true;

        // The uncontrolled component value should be updated at the moment the gene query is updated
        this.updateTextAreaRefValue();
    }

    @action.bound
    private changeIcon() {
        this.showComment = !this.showComment;
    }

    private getTextAreaValue() {
        if (this.showFullText) {
            return this.geneQueryStr;
        } else {
            return this.getFocusOutValue();
        }
    }

    @action.bound
    updateTextAreaRefValue() {
        this.textAreaRef.current!.value = this.getTextAreaValue();
    }

    private getFocusOutValue() {
        return getFocusOutText(
            getOQL(this.geneQueryStr).query.map(query => query.gene)
        );
    }

    @computed private get textAreaClasses() {
        let classNames: string[] = [];

        switch (this.props.location) {
            case GeneBoxType.STUDY_VIEW_PAGE:
                classNames.push(styles.studyView);
                if (this.isFocused || !this.geneQueryIsValid) {
                    classNames.push(styles.studyViewFocus);
                }
                break;
            case GeneBoxType.ONCOPRINT_HEATMAP:
                classNames.push(styles.oncoprintHeatmap);
                break;
            default:
                classNames.push(styles.default);
                break;
        }
        if (!this.geneQueryStr) {
            classNames.push(styles.empty);
        }
        return classNames;
    }

    @computed get showFullText() {
        return (
            !this.geneQueryIsValid ||
            this.isFocused ||
            this.props.location !== GeneBoxType.STUDY_VIEW_PAGE
        );
    }

    @action.bound
    afterGeneSymbolValidation(
        validQuery: boolean,
        validationResult: GeneValidationResult,
        oql: OQL
    ) {
        this.geneQueryIsValid = validQuery;

        if (this.props.callback) {
            this.props.callback(oql, validationResult, this.geneQueryStr);
        }
    }

    @autobind
    highlightError(oql: OQL) {
        this.textAreaRef.current!.focus();
        this.textAreaRef.current!.setSelectionRange(
            oql.error!.start,
            oql.error!.end
        );
    }

    @computed
    get promptText() {
        return this.props.textBoxPrompt
            ? this.props.textBoxPrompt
            : 'Click gene symbols below or enter here';
    }

    handleSubmit() {}

    @bind onChange(event: any) {
        this.currentTextAreaValue = event.currentTarget.value;
        this.geneQueryStr = this.currentTextAreaValue;
        this.updateQueryToBeValidateDebounce();
    }

    @bind onFocus() {
        this.isFocused = true;
    }

    @bind onBlur() {
        this.isFocused = false;
    }

    @bind replaceGene(oldSymbol: string, newSymbol: string) {
        let updatedQuery = normalizeQuery(
            this.getTextAreaValue()
                .toUpperCase()
                .replace(
                    new RegExp(`\\b${oldSymbol.toUpperCase()}\\b`, 'g'),
                    () => newSymbol.toUpperCase()
                )
        );
        this.updateGeneQuery(updatedQuery);
    }

    @computed get showErrorsAndMessages() {
        return (
            this.props.location !== GeneBoxType.STUDY_VIEW_PAGE ||
            this.isFocused
        );
    }

    renderMessages() {
        enum Speaker {
            AI,
            User,
        }
        let messages: Map<Speaker, String> = new Map();

        messages.set(
            Speaker.AI,
            "Hi there! \n My name is Tobi, I'm cBioPortal's Support Robot 🤖"
        );
        messages.set(Speaker.AI, 'What can I do for you today?');
        messages.set(Speaker.User, 'I have a question foo bar foo bar');

        messages.forEach((value: String, key: Speaker) => {});

        return (
            <div>
                <div className={styles.message}>hello</div>
                <div className={styles.question}>question</div>
            </div>
        );
    }

    chatWindow() {
        return (
            <div className={styles.chatWindow}>
                <section className={styles.titlearea}>
                    cBioPortal Support
                </section>

                <div className={styles.textarea}>
                    <div className={styles.textheader}>
                        Please ask your cBioPortal related questions here for
                        example OQL, which the ai will format for you
                    </div>
                    {this.renderMessages()}
                </div>

                <div className={styles.inputarea}>
                    <form className={styles.form}>
                        <input
                            className={styles.input}
                            type="text"
                            value="Type a message"
                        />
                        <button
                            className="fa fa-paper-plane"
                            aria-hidden="true"
                            style={{
                                fontSize: '20px',
                                color: '#3498db',
                                marginLeft: '4px',
                                margin: 'auto',
                                border: '0px',
                                background: 'none',
                            }}
                        ></button>
                    </form>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className={styles.genesSelection}>
                <div className={styles.topRow}>
                    <textarea
                        ref={this.textAreaRef as any}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}
                        className={classnames(this.textAreaClasses)}
                        rows={5}
                        cols={80}
                        placeholder={this.promptText}
                        title={this.promptText}
                        defaultValue={this.getTextAreaValue()}
                        onChange={this.onChange}
                        data-test="geneSet"
                        style={{ height: this.props.textAreaHeight }}
                    />

                    <button
                        style={{ width: '48px', height: '48px' }}
                        className="btn btn-primary btn-lg"
                        data-test="aiButton"
                        onClick={this.changeIcon}
                    >
                        {this.showComment ? (
                            <i
                                className="fa fa-comment"
                                style={{ fontSize: '24px', marginLeft: '-4px' }}
                            ></i>
                        ) : (
                            <i
                                className="fa fa-angle-down"
                                style={{ fontSize: '24px' }}
                            ></i>
                        )}
                    </button>
                    {!this.showComment && this.chatWindow()}

                    {this.props.submitButton}
                </div>
                {this.props.validateInputGeneQuery && (
                    <div className={'oqlValidationContainer'}>
                        <GeneSymbolValidator
                            focus={this.props.focus}
                            geneQuery={this.queryToBeValidated}
                            skipGeneValidation={this.skipGenesValidation}
                            updateGeneQuery={this.updateGeneQuery}
                            afterValidation={this.afterGeneSymbolValidation}
                            replaceGene={this.replaceGene}
                            errorMessageOnly={
                                this.props.location ===
                                GeneBoxType.STUDY_VIEW_PAGE
                            }
                            highlightError={this.highlightError}
                        >
                            {this.props.children}
                        </GeneSymbolValidator>
                    </div>
                )}
                {!this.props.validateInputGeneQuery &&
                    this.afterGeneSymbolValidation(
                        true,
                        { found: [], suggestions: [] },
                        getOQL(this.geneQueryStr)
                    )}
                <div>
                    {this.showErrorsAndMessages && this.props.error && (
                        <span
                            className={queryStoreStyles.errorMessage}
                            data-test="oqlErrorMessage"
                        >
                            {this.props.error}
                        </span>
                    )}

                    {this.showErrorsAndMessages &&
                        this.props.messages &&
                        this.props.messages.map(msg => (
                            <span className={queryStoreStyles.oqlMessage}>
                                <i
                                    className="fa fa-info-circle"
                                    style={{
                                        marginRight: 5,
                                    }}
                                />
                                {msg}
                            </span>
                        ))}
                </div>
            </div>
        );
    }
}
