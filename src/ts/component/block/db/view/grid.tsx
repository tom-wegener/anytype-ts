import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.BlockDb {};

class ViewGrid extends React.Component<Props, {}> {

	render () {
		const { data, properties } = this.props;
		
		const CellHead = (item: any) => (
			<th className={'cellHead c' + item.type}>
				<Icon className={'property c' + item.type} />
				{item.name}
			</th>
		);
		
		const CellBody = (item: any) => (
			<td className={'cellBody c' + item.property.type}>
				{item.data}
			</td>
		);
		
		const RowHead = (item: any) => (
			<tr className="row">
				{properties.map((item: any, i: number) => (
					<CellHead key={item.id} {...item} />
				))}
				<th className="cellHead">
					<Icon className="plus" />
				</th>
			</tr>
		);
		
		const RowBody = (item: any) => (
			<tr className="row">
				{properties.map((property: any, i: number) => (
					<CellBody key={property.id} property={...property} data={data[item.index][property.id]} />
				))}
				<td className="cellBody">&nbsp;</td>
			</tr>
		);
		
		return (
			<table className="view viewGrid">
				<thead>
					<RowHead />
				</thead>
				<tbody>
					{data.map((item: any, i: number) => (
						<RowBody key={i} index={i} {...item} />
					))}
					<tr>
						<td className="cellBody" colSpan={properties.length + 1}>
							<Icon className="plus" />
						</td>
					</tr>
				</tbody>
			</table>
		);
	};
	
};

export default ViewGrid;