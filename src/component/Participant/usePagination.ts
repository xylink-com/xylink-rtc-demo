import { useCallback, useRef, useState } from 'react';
import { PARTICIPANT_PAGE_SIZE } from '@/enum';

interface IParams {
  pageSize?: number;
  currentPage?: number;
  data?: any;
}

const initialState = {
  pageSize: PARTICIPANT_PAGE_SIZE,
  currentPage: 1,
  totalPage: 0,
  totalCount: 0
};

export default function usePagination<T>(initialData: T) {
  // @ts-ignore
  const [data, setData] = useState<T>(() => initialData.slice(0, initialState.pageSize));
  const [pageInfo, setPageInfo] = useState(initialState);
  // @ts-ignore
  const initialDataRef = useRef(initialData.slice(0, initialState.pageSize));
  const stateRef = useRef(initialState);

  // 分页
  const filter = useCallback((state) => {
    let { currentPage, pageSize } = state;
    let newData: unknown = initialDataRef.current;
    let totalCount = 0;

    if (newData instanceof Array) {
      totalCount = newData.length;
      const startIndex = Math.max((currentPage - 1) * pageSize, 0);
      const endIndex = startIndex + pageSize > totalCount ? totalCount : startIndex + pageSize;
      newData = newData.slice(startIndex, endIndex);

      // 当前页没有数据时，返回第一页
      if (currentPage > 1 && (newData as Array<any>).length === 0) {
        currentPage -= 1;
        stateRef.current = {
          ...stateRef.current,
          currentPage
        };
        filter(stateRef.current);
      }
    }

    let totalPage = Math.ceil(initialDataRef.current.length / pageSize);

    setPageInfo((pageInfo) => ({
      ...pageInfo,
      totalPage,
      currentPage,
      totalCount
    }));

    setData(newData as T);
  }, []);

  // 请求数据
  const fetch = useCallback(
    (params: IParams) => {
      stateRef.current = {
        ...stateRef.current,
        ...params
      };

      if (params.data) {
        initialDataRef.current = params.data;
      }

      filter(stateRef.current);
    },
    [filter]
  );

  return { data, pageInfo, fetch };
}
