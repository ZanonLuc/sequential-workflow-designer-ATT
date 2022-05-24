import { Svg } from '../core/svg';
import { Vector } from '../core/vector';
import { Sequence } from '../definition';
import { DesignerConfiguration } from '../designer-configuration';
import { Component, ComponentView, Placeholder, StepComponent } from './component';
import { JoinRenderer } from './join-renderer';
import { SequencePlaceholder } from './sequence-placeholder';
import { StepComponentFactory } from './step-component-factory';

const PH_WIDTH = 100;
const PH_HEIGHT = 24;

export class SequenceComponent implements Component {

	public static create(sequence: Sequence, configuration: DesignerConfiguration): SequenceComponent {
		const components = sequence.steps.map(s => StepComponentFactory.create(s, sequence, configuration));
		const view = SequenceComponentView.create(components);
		return new SequenceComponent(view, sequence, components);
	}

	private constructor(
		public readonly view: SequenceComponentView,
		private readonly sequence: Sequence,
		private readonly components: Component[]) {
	}

	public findStepComponent(element: Element): StepComponent | null {
		for (let component of this.components) {
			const sc = component.findStepComponent(element);
			if (sc) {
				return sc;
			}
		}
		return null;
	}

	public getPlaceholders(result: Placeholder[]) {
		this.view.placeholders.forEach((ph, index) => {
			result.push(new SequencePlaceholder(ph, this.sequence, index));
		});
		this.components.forEach(c => c.getPlaceholders(result));
	}

	public setIsMoving(isEnabled: boolean) {
		this.view.setIsMoving(isEnabled);
		this.components.forEach(c => c.setIsMoving(isEnabled));
	}
}

export class SequenceComponentView implements ComponentView {

	public static create(components: Component[]): SequenceComponentView {
		const g = Svg.element('g');

		const maxJoinX = (components.length > 0)
			? Math.max(...components.map(c => c.view.joinX))
			: (PH_WIDTH / 2);
		const maxWidth = (components.length > 0)
			? Math.max(...components.map(c => c.view.width))
			: PH_WIDTH;

		let offsetY = PH_HEIGHT;

		const placeholders: SVGElement[] = [];
		for (let i = 0; i < components.length; i++) {
			const component = components[i];
			const offsetX = maxJoinX - component.view.joinX;

			JoinRenderer.appendStraightJoin(g, new Vector(maxJoinX, offsetY - PH_HEIGHT), PH_HEIGHT);

			placeholders.push(appendPlaceholder(g,
				maxJoinX - PH_WIDTH / 2,
				offsetY - PH_HEIGHT));

			Svg.translate(component.view.g, offsetX, offsetY);
			g.appendChild(component.view.g);
			offsetY += component.view.height + PH_HEIGHT;
		}

		JoinRenderer.appendStraightJoin(g, new Vector(maxJoinX, offsetY - PH_HEIGHT), PH_HEIGHT);
		placeholders.push(appendPlaceholder(g, maxJoinX - PH_WIDTH / 2, offsetY - PH_HEIGHT));

		return new SequenceComponentView(g, maxWidth, offsetY, maxJoinX, placeholders);
	}

	private constructor(
		public readonly g: SVGGElement,
		public readonly width: number,
		public readonly height: number,
		public readonly joinX: number,
		public readonly placeholders: SVGElement[]) {
	}

	public getPosition(): Vector {
		throw new Error('Not supported');
	}

	public setIsMoving(isMoving: boolean) {
		this.placeholders.forEach(p => {
			Svg.attrs(p, {
				visibility: isMoving ? 'visible' : 'hidden'
			});
		});
	}
}

function appendPlaceholder(g: SVGGElement, x: number, y: number): SVGElement {
	const rect = Svg.element('rect', {
		class: 'sqd-placeholder',
		width: PH_WIDTH,
		height: PH_HEIGHT,
		x,
		y,
		rx: 6,
		ry: 6,
		visibility: 'hidden'
	});
	g.appendChild(rect);
	return rect;
}
