import React, { CSSProperties, ReactNode, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TimeSync, WebglContext, TrendCursorSync } from '@iot-app-kit/react-components';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { selectedRect } from '~/util/select';
/**
 * Component imports
 */
import { ResizablePanes } from '../resizablePanes';
import ContextMenu from '../contextMenu';
import { GestureableGrid, ReadOnlyGrid } from '../grid';
import Widgets from '../widgets/list';
import UserSelection from '../userSelection';
import ComponentPalette from '../palette';
import CustomDragLayer from '../dragLayer';
import { ResourceExplorer } from '../resourceExplorer';
import ViewportSelection from '../viewportSelection';
import Actions from '../actions';

/**
 * Store imports
 */
import {
  onBringWidgetsToFrontAction,
  onCopyWidgetsAction,
  onCreateWidgetsAction,
  onDeleteWidgetsAction,
  onPasteWidgetsAction,
  onSendWidgetsToBackAction,
} from '~/store/actions';
import { widgetCreator } from '~/store/actions/createWidget/presets';

import { toGridPosition } from '~/util/position';
import { useGestures } from './gestures';
import { useKeyboardShortcuts } from './keyboardShortcuts';

import { DefaultDashboardMessages } from '~/messages';
import type { DashboardSave, Position, DashboardWidget } from '~/types';
import type { ContextMenuProps } from '../contextMenu';
import type { DropEvent, GesturableGridProps } from '../grid';
import type { WidgetsProps } from '../widgets/list';
import type { UserSelectionProps } from '../userSelection';
import type { DashboardState } from '~/store/state';
import { useSelectedWidgets } from '~/hooks/useSelectedWidgets';

import '@iot-app-kit/components/styles.css';
import './index.css';

type InternalDashboardProperties = {
  onSave?: DashboardSave;
  editable?: boolean;
  propertiesPanel?: ReactNode;
};

const Divider = () => <div className='divider' />;

const defaultUserSelect: CSSProperties = { userSelect: 'initial' };
const disabledUserSelect: CSSProperties = { userSelect: 'none' };

const InternalDashboard: React.FC<InternalDashboardProperties> = ({ onSave, editable, propertiesPanel }) => {
  /**
   * disable user select styles on drag to prevent highlighting of text under the pointer
   */
  const [userSelect, setUserSelect] = useState<CSSProperties>(defaultUserSelect);

  /**
   * Store variables
   */
  const dashboardConfiguration = useSelector((state: DashboardState) => state.dashboardConfiguration);
  const grid = useSelector((state: DashboardState) => state.grid);
  const cellSize = useSelector((state: DashboardState) => state.grid.cellSize);
  const copiedWidgets = useSelector((state: DashboardState) => state.copiedWidgets);
  const readOnly = useSelector((state: DashboardState) => state.readOnly);
  const selectedWidgets = useSelectedWidgets();
  const significantDigits = useSelector((state: DashboardState) => state.significantDigits);

  const [viewFrame, setViewFrameElement] = useState<HTMLDivElement | undefined>(undefined);

  const dispatch = useDispatch();
  const createWidgets = (widgets: DashboardWidget[]) =>
    dispatch(
      onCreateWidgetsAction({
        widgets,
      })
    );

  const copyWidgets = () => {
    dispatch(
      onCopyWidgetsAction({
        widgets: selectedWidgets,
      })
    );
  };

  const pasteWidgets = (position?: Position) => {
    dispatch(
      onPasteWidgetsAction({
        position,
      })
    );
  };

  const bringWidgetsToFront = () => {
    dispatch(onBringWidgetsToFrontAction());
  };

  const sendWidgetsToBack = () => {
    dispatch(onSendWidgetsToBackAction());
  };

  const deleteWidgets = () => {
    dispatch(
      onDeleteWidgetsAction({
        widgets: selectedWidgets,
      })
    );
  };

  /**
   * setup keyboard shortcuts for actions
   */
  useKeyboardShortcuts();

  /**
   * setup gesture handling for grid
   */
  const { activeGesture, userSelection, onPointClick, onGestureStart, onGestureUpdate, onGestureEnd } = useGestures({
    dashboardConfiguration,
    selectedWidgets,
    cellSize,
  });

  const onDrop = (e: DropEvent) => {
    const { item, position } = e;
    const componentTag = item.componentTag;

    const widgetPresets = widgetCreator(grid)(componentTag);

    const { x, y } = toGridPosition(position, cellSize);

    const widget: DashboardWidget = {
      ...widgetPresets,
      x: Math.floor(x),
      y: Math.floor(y),
      z: 0,
    };
    createWidgets([widget]);
  };

  /**
   *
   * Child component props configuration
   */
  const gridProps: GesturableGridProps = {
    readOnly: readOnly,
    grid,
    click: onPointClick,
    dragStart: onGestureStart,
    drag: onGestureUpdate,
    dragEnd: onGestureEnd,
    drop: onDrop,
  };

  const widgetsProps: WidgetsProps = {
    readOnly,
    dashboardConfiguration,
    selectedWidgets,
    messageOverrides: DefaultDashboardMessages,
    cellSize,
    dragEnabled: grid.enabled,
  };

  const selectionProps: UserSelectionProps = {
    rect: selectedRect(userSelection),
  };

  const contextMenuProps: ContextMenuProps = {
    messageOverrides: DefaultDashboardMessages,
    copyWidgets,
    pasteWidgets,
    deleteWidgets,
    sendWidgetsToBack,
    bringWidgetsToFront,
    hasCopiedWidgets: copiedWidgets.length > 0,
    hasSelectedWidgets: selectedWidgets.length > 0,
  };

  if (readOnly) {
    return (
      <TimeSync group='default-dashboard-edit'>
        <TrendCursorSync>
          <div className='dashboard'>
            <div className='dashboard-toolbar-read-only'>
              <Box float='right' padding='s'>
                <SpaceBetween size='s' direction='horizontal'>
                  <ViewportSelection key='1' messageOverrides={DefaultDashboardMessages} />
                  {editable && (
                    <>
                      <Divider key='2' />
                      <Actions
                        key='3'
                        readOnly={readOnly}
                        onSave={onSave}
                        dashboardConfiguration={dashboardConfiguration}
                        grid={grid}
                        significantDigits={significantDigits}
                        editable={editable}
                      />
                    </>
                  )}
                </SpaceBetween>
              </Box>
            </div>
            <div className='display-area' ref={(el) => setViewFrameElement(el || undefined)}>
              <ReadOnlyGrid {...grid}>
                <Widgets {...widgetsProps} />
              </ReadOnlyGrid>
              <WebglContext viewFrame={viewFrame} />
            </div>
          </div>
        </TrendCursorSync>
      </TimeSync>
    );
  }

  return (
    <TimeSync group='default-dashboard-view'>
      <TrendCursorSync>
        <div className='dashboard' style={userSelect}>
          <CustomDragLayer
            onDrag={(isDragging) => setUserSelect(isDragging ? disabledUserSelect : defaultUserSelect)}
          />
          <div className='dashboard-toolbar'>
            <Box float='left' padding='xs'>
              <ComponentPalette />
            </Box>
            <Box float='right' padding='xs'>
              <SpaceBetween size='s' direction='horizontal'>
                <ViewportSelection key='1' messageOverrides={DefaultDashboardMessages} />
                <Divider key='2' />
                <Actions
                  key='3'
                  readOnly={readOnly}
                  onSave={onSave}
                  dashboardConfiguration={dashboardConfiguration}
                  grid={grid}
                  significantDigits={significantDigits}
                  editable={editable}
                />
              </SpaceBetween>
            </Box>
          </div>
          <ResizablePanes
            leftPane={<ResourceExplorer />}
            centerPane={
              <div className='display-area' ref={(el) => setViewFrameElement(el || undefined)}>
                <GestureableGrid {...gridProps}>
                  <ContextMenu {...contextMenuProps} />
                  <Widgets {...widgetsProps} />
                  {activeGesture === 'select' && <UserSelection {...selectionProps} />}
                </GestureableGrid>
                <WebglContext viewFrame={viewFrame} />
              </div>
            }
            rightPane={propertiesPanel}
          />
        </div>
      </TrendCursorSync>
    </TimeSync>
  );
};

export default InternalDashboard;
