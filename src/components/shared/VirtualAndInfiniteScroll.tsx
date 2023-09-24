import React, { ReactElement, useEffect, useRef, useState } from "react";
import {
  AutoSizer,
  InfiniteLoader,
  List,
  WindowScroller,
  CellMeasurerCache,
  CellMeasurer,
} from "react-virtualized";

const Row = ({ ref, style, repository }) => (
  <div ref={ref} className=" py-52" style={style}>
    Hello
  </div>
);

const rowRenderer = ({
  cache,
  list,
  renderRow,
  rowData: {
    key, // Unique key within array of rows
    index, // Index of row within collection
    style, // Style object to be applied to row (to position it)
    parent,
  },
  height,
}) => {
  console.log({
    key, // Unique key within array of rows
    index, // Index of row within collection
    style, // Style object to be applied to row (to position it)
    parent,
    height,
  });
  // const RowComponent = renderRow({ item: list[index], style });
  return (
    <CellMeasurer
      key={key}
      cache={cache.current}
      parent={parent}
      rowIndex={index}
      columnIndex={0}
    >
      {({ measure, registerChild }) =>
        renderRow({ item: list[index], style, measure, registerChild })
      }
      {renderRow({ item: list[index], style })}
    </CellMeasurer>
  );
};

export default function VirtualAndInfiniteScroll({
  renderRow,
  loaderComponent,
  totalCount,
  fetchHandler,
  list,
  className,
  isNextPageLoading,
}: {
  renderRow: ({ item, style }) => ReactElement<React.FC>;
  loaderComponent: ReactElement<React.FC>;
  totalCount: number;
  fetchHandler: (page: number) => Promise<unknown>;
  list: Array<unknown>;
  className?: string;
}) {
  // const [pageCount, setPageCount] = useState(2);
  console.log({ list, totalCount });

  const cache = useRef(
    new CellMeasurerCache({
      defaultHeight: 100,
      fixedWidth: true,
    })
  );

  function isRowLoaded({ index }) {
    return !!list[index];
  }

  const handleNewPageLoad = async () => {
    let pageCount = Math.floor(list.length / 7) + 1;
    console.log({ isNextPageLoading });
    console.log({ pageCount });
    if (isNextPageLoading) {
      return;
    }
    await fetchHandler(pageCount);
    // setPageCount((pageCount) => pageCount + 1);
  };

  let [listRef, setListRef] = useState(null);

  useEffect(() => {
    console.log({ s: listRef?.recomputeRowHeights });
    // Recompute row heights and offsets
    listRef?.recomputeRowHeights();
    // Reset cached measurements for all cells.
    cache.current.clearAll();
  }, [list]);

  return (
    <div className={`mt-4 ${className} h-full`}>
      <AutoSizer disableHeight={true}>
        {({ width }) => (
          <WindowScroller>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
              <InfiniteLoader
                isRowLoaded={isRowLoaded}
                loadMoreRows={handleNewPageLoad}
                rowCount={totalCount}
                threshold={3}
                minimumBatchSize={8}
              >
                {({ onRowsRendered, registerChild }) => (
                  <List
                    deferredMeasurementCache={cache.current}
                    autoHeight
                    onRowsRendered={onRowsRendered}
                    ref={(el) => {
                      setListRef(el);
                      registerChild(el);
                    }}
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    rowCount={list.length}
                    rowHeight={cache.current.rowHeight}
                    rowRenderer={(rowData) =>
                      rowRenderer({ cache, list, renderRow, rowData })
                    }
                    scrollTop={scrollTop}
                    width={width}
                  />
                )}
              </InfiniteLoader>
            )}
          </WindowScroller>
        )}
      </AutoSizer>
      {/* <InfiniteLoader
        isRowLoaded={isRowLoaded}
        loadMoreRows={handleNewPageLoad}
        rowCount={totalCount}
        ref={(ref) => setInfiniteLoaderRef(ref)}
      >
        {({ onRowsRendered, registerChild }) => (
          <div className="h-full " style={{ flex: '1 1 auto' }}>
            <AutoSizer>
              {({ width, height }) => {
                console.log({height});
                return (
                  <List
                    rowCount={list.length}
                    width={width}
                    height={height}
                    rowHeight={cache.current.rowHeight}
                    rowRenderer={(rowData) =>
                      rowRenderer({ cache, list, renderRow, rowData, height })
                    }
                    deferredMeasurementCache={cache.current.cellMeasurerCache}
                    overscanRowCount={0}
                    onRowsRendered={onRowsRendered}
                    ref={(el) => {
                      setListRef(el);
                      registerChild(el);
                    }}
                  />
                );
              }}
            </AutoSizer>
          </div>
        )}
      </InfiniteLoader> */}
      {isNextPageLoading && loaderComponent}
    </div>
  );
}