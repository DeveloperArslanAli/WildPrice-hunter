import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { OnboardingScreen } from './OnboardingScreen';

describe('OnboardingScreen (QA Flow & Interaction Tests)', () => {
  let mockNavigation: any;

  beforeEach(() => {
    mockNavigation = {
      replace: jest.fn(),
      navigate: jest.fn(),
    };
  });

  it('should render initial slide with Step 1 and brutalist link preview', async () => {
    let renderer: any;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OnboardingScreen navigation={mockNavigation} />);
    });

    const str = JSON.stringify(renderer.toJSON());
    expect(str).toContain('WILDPRICE');
    expect(str).toContain('STEP 1: ANY PLATFORM');
    expect(str).toContain('DROP ANY PRODUCT LINK');
    expect(str).toContain('LINK_DETECTED.EXE');
    expect(str).toContain('SKIP');
  });

  it('should have skip button that replaces navigation with Main', async () => {
    let renderer: any;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OnboardingScreen navigation={mockNavigation} />);
    });

    const root = renderer.root;
    const skipTextNode = root.findAll(
      (node: any) => node.type === 'Text' && node.props && node.props.children === 'SKIP',
    )[0];
    expect(skipTextNode).toBeDefined();

    let node: any = skipTextNode;
    while (node && (!node.props || typeof node.props.onPress !== 'function')) {
      node = node.parent;
    }
    expect(node).toBeDefined();

    await ReactTestRenderer.act(() => {
      node.props.onPress();
    });

    expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
  });
});
