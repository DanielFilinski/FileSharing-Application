import { styled } from "styled-components";

const PADDING = 16;
const CONTENT_MAX_WIDTH = 1000;
const ICON_TITLE_GAP = 16;
const ICON_TITLE_HEADER_GAP = 8;
const TEXT_ROWS_GAP = 8;
const ROW_ITEM_GAP = 24;


const ScreenContainer = styled.div`
  padding: 0px;
  margin: 0px;
`;

const HeaderContainer = styled.header`
  padding: ${PADDING}px;
`;

const ContentContainer = styled.main`
  padding: ${PADDING}px;
  max-width: ${CONTENT_MAX_WIDTH}px;
  margin: 0 auto;
`;

const CardContainer = styled.main`
  padding: ${PADDING}px;
`;

const FooterContainer = styled.footer`
  padding: ${PADDING}px;
`;

const IconTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${ICON_TITLE_GAP}px;
`;

const IconTitleHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${ICON_TITLE_HEADER_GAP}px;
`;

const TextRowsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${TEXT_ROWS_GAP}px;
`;

const RowSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RowItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${ROW_ITEM_GAP}px;
`;

export { 
    ScreenContainer, 
    HeaderContainer, 
    ContentContainer, 
    IconTitleContainer,
    IconTitleHeaderContainer,
    TextRowsContainer,
    RowSpaceBetween,
    RowItemContainer
};