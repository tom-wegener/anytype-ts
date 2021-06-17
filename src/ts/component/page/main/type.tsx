import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainEdit as Header, FooterMainEdit as Footer, Loader, Block, Button, ListTemplate, ListObject } from 'ts/component';
import { I, M, C, DataUtil, Util, keyboard, focus, crumbs, Action } from 'ts/lib';
import { commonStore, detailStore, dbStore, menuStore, popupStore, blockStore } from 'ts/store';
import { getRange } from 'selection-ranges';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

interface State {
	templates: any[];
};

const $ = require('jquery');
const BLOCK_ID_OBJECT = 'dataview';
const BLOCK_ID_TEMPLATE = 'templates';
const EDITOR_IDS = [ 'name', 'description' ];
const Constant = require('json/constant.json');

@observer
class PageMainType extends React.Component<Props, State> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	loading: boolean = false;
	timeout: number = 0;
	page: number = 0;

	state = {
		templates: [],
	};

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onTemplateAdd = this.onTemplateAdd.bind(this);
		this.onObjectAdd = this.onObjectAdd.bind(this);
	};

	render () {
		if (this.loading) {
			return <Loader />;
		};

		const { config } = commonStore;
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const object = Util.objectCopy(detailStore.get(rootId, rootId, []));
		const { total } = dbStore.getMeta(rootId, BLOCK_ID_OBJECT);
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const placeHolder = {
			name: Constant.default.nameType,
			description: 'Add a description',
		};
		const type: any = dbStore.getObjectType(rootId) || {};
		const templates = dbStore.getData(rootId, BLOCK_ID_TEMPLATE);

		const allowedObject = (type.types || []).indexOf(I.SmartBlockType.Page) >= 0;
		const allowedDetails = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedRelation = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const allowedTemplate = allowedObject;
		const showTemplates = type.id != Constant.typeId.page;

		if (object.name == Constant.default.name) {
			object.name = '';
		};

		let relations = Util.objectCopy(dbStore.getRelations(rootId, rootId));
		if (!config.debug.ho) {
			relations = relations.filter((it: any) => { return !it.isHidden; });
		};
		relations.sort(DataUtil.sortByHidden);

		const Editor = (item: any) => {
			return (
				<div className={[ 'wrap', item.className ].join(' ')}>
					{!allowedDetails ? (
						<div id={'editor-' + item.id} className={[ 'editor', 'focusable', 'c' + item.id, 'isReadOnly' ].join(' ')}>
							{object[item.id]}
						</div>
					) : (
						<React.Fragment>
							<div 
								id={'editor-' + item.id}
								className={[ 'editor', 'focusable', 'c' + item.id ].join(' ')}
								contentEditable={true}
								suppressContentEditableWarning={true}
								onFocus={(e: any) => { this.onFocus(e, item); }}
								onBlur={(e: any) => { this.onBlur(e, item); }}
								onKeyDown={(e: any) => { this.onKeyDown(e, item); }}
								onKeyUp={(e: any) => { this.onKeyUp(e, item); }}
								onInput={(e: any) => { this.onInput(e, item); }}
								onSelect={(e: any) => { this.onSelectText(e, item); }}
							>
								{object[item.id]}
							</div>
							<div className={[ 'placeHolder', 'c' + item.id ].join(' ')}>{placeHolder[item.id]}</div>
						</React.Fragment>
					)}
				</div>
			);
		};

		const Relation = (item: any) => (
			<div className={[ 'item', (item.isHidden ? 'isHidden' : ''), (allowedRelation ? 'canEdit' : '') ].join(' ')}>
				<div className="clickable" onClick={(e: any) => { this.onRelationEdit(e, item.relationKey); }}>
					<Icon className={[ 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
					<div className="name">{item.name}</div>
				</div>
			</div>
		);

		const ItemAdd = (item: any) => (
			<div id="item-add" className="item add" onClick={(e: any) => { this.onRelationAdd(e); }}>
				<div className="clickable">
					<Icon className="plus" />
					<div className="name">New</div>
				</div>
				<div className="value" />
			</div>
		);

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				<div className="blocks wrapper">
					<div className="head">
						<div className="side left">
							<IconObject id={'icon-' + rootId} size={96} object={object} canEdit={allowedDetails} onSelect={this.onSelect} onUpload={this.onUpload} />
						</div>
						<div className="side center">
							<Editor className="title" id="name" />
							<Editor className="descr" id="description" />

							<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} readOnly={true} />
						</div>
						<div className="side right">
							{allowedObject ? <Button text="Create" className="orange" onClick={this.onObjectAdd} /> : ''}
						</div>
					</div>

					{showTemplates ? (
						<div className="section template">
							<div className="title">
								{templates.length} templates

								{allowedTemplate ? (
									<div className="btn" onClick={this.onTemplateAdd}>
										<Icon className="plus" />New
									</div>
								) : ''}
							</div>
							{templates.length ? (
								<div className="content">
									<ListTemplate 
										key="listTemplate"
										items={templates}
										canAdd={allowedTemplate}
										onAdd={this.onTemplateAdd}
										onClick={(e: any, item: any) => { DataUtil.objectOpenPopup(item); }} 
									/>
								</div>
							) : (
								<div className="empty">
									This object type doesn't have templates
								</div>
							)}
						</div>
					) : ''}

					<div className="section note dn">
						<div className="title">Notes</div>
						<div className="content">People often distinguish between an acquaintance and a friend, holding that the former should be used primarily to refer to someone with whom one is not especially close. Many of the earliest uses of acquaintance were in fact in reference to a person with whom one was very close, but the word is now generally reserved for those who are known only slightly.</div>
					</div>

					<div className="section relation">
						<div className="title">{relations.length} relations</div>
						<div className="content">
							{relations.map((item: any, i: number) => (
								<Relation key={i} {...item} />
							))}
							{allowedRelation ? <ItemAdd /> : ''}
						</div>
					</div>

					<div className="section set">
						<div className="title">{total} objects</div>
						<div className="content">
							<ListObject rootId={rootId} blockId={BLOCK_ID_OBJECT} />
						</div>
					</div>
				</div>

				<Footer {...this.props} rootId={rootId} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
	};

	componentDidUpdate () {
		this.open();

		for (let id of EDITOR_IDS) {
			this.placeHolderCheck(id);
		};

		window.setTimeout(() => { focus.apply(); }, 10);
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();

		focus.clear(true);
		window.clearTimeout(this.timeout);
	};

	open () {
		const { history } = this.props;
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();

		crumbs.addCrumbs(rootId);
		crumbs.addRecent(rootId);

		C.BlockOpen(rootId, (message: any) => {
			if (message.error.code) {
				history.push('/main/index');
				return;
			};

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
		});
	};

	close () {
		const { isPopup, match } = this.props;
		const rootId = this.getRootId();
		
		let close = true;
		if (isPopup && (match.params.id == rootId)) {
			close = false;
		};

		if (close) {
			Action.pageClose(rootId);
		};
	};

	onSelect (icon: string) {
		const rootId = this.getRootId();
		DataUtil.pageSetIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const rootId = this.getRootId();
		DataUtil.pageSetIcon(rootId, '', hash);
	};

	onTemplateAdd () {
		const rootId = this.getRootId();

		C.MakeTemplateByObjectType(rootId, (message) => {
			DataUtil.objectOpenPopup({ id: message.id });
		});
	};

	onObjectAdd () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const details: any = {
			type: rootId,
			layout: object.recommendedLayout,
		};

		const create = (templateId: string) => {
			DataUtil.pageCreate('', '', details, I.BlockPosition.Bottom, templateId, (message: any) => {
				DataUtil.objectOpenPopup({ ...details, id: message.targetId });
			});
		};

		const showMenu = () => {
			popupStore.open('template', {
				data: {
					typeId: rootId,
					onSelect: create,
				},
			});
		};

		DataUtil.checkTemplateCnt([ rootId ], 2, (message: any) => {
			if (message.records.length > 1) {
				showMenu();
			} else {
				create(message.records.length ? message.records[0].id : '');
			};
		});
	};

	onRelationAdd (e: any) {
		const rootId = this.getRootId();
		const relations = dbStore.getRelations(rootId, rootId);

		menuStore.open('relationSuggest', { 
			element: $(e.currentTarget),
			offsetX: 32,
			data: {
				filter: '',
				rootId: rootId,
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectTypeRelationAdd(rootId, [ relation ], () => { menuStore.close('relationSuggest'); });
				},
			}
		});
	};

	onRelationEdit (e: any, relationKey: string) {
		const rootId = this.getRootId();
		
		menuStore.open('blockRelationEdit', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				relationKey: relationKey,
				readOnly: false,
				updateCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationUpdate(rootId, relation);
				},
			}
		});
	};

	onFocus (e: any, item: any) {
		keyboard.setFocus(true);

		this.placeHolderCheck(item.id);
	};

	onBlur (e: any, item: any) {
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);
		this.save();
	};

	onInput (e: any, item: any) {
		this.placeHolderCheck(item.id);
	};

	onKeyDown (e: any, item: any) {
		this.placeHolderCheck(item.id);

		if (item.id == 'name') {
			keyboard.shortcut('enter', e, (pressed: string) => {
				e.preventDefault();
			});
		};
	};

	onKeyUp (e: any, item: any) {
		this.placeHolderCheck(item.id);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	onSelectText (e: any, item: any) {
		focus.set(item.id, this.getRange(item.id));
	};

	save () {
		const rootId = this.getRootId();
		const details = [];
		const object: any = { id: rootId };

		for (let id of EDITOR_IDS) {
			const value = this.getValue(id);

			details.push({ key: id, value: value });
			object[id] = value;
		};
		dbStore.objectTypeUpdate(object);

		C.BlockSetDetails(rootId, details);
	};

	getRange (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('#editor-' + id).get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	getValue (id: string): string {
		if (!this._isMounted) {
			return '';
		};

		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#editor-' + id);

		return value.length ? String(value.get(0).innerText || '') : '';
	};

	placeHolderCheck (id: string) {
		const value = this.getValue(id);
		value.length ? this.placeHolderHide(id) : this.placeHolderShow(id);			
	};

	placeHolderHide (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder.c' + id).hide();
	};
	
	placeHolderShow (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder.c' + id).show();
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

};

export default PageMainType;