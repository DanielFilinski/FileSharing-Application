import { styled } from "styled-components";
import { Card, tokens } from "@fluentui/react-components";

const CONTENT_MAX_WIDTH = 1000;
const CONTENT_PADDING_TOP = 24;


const PADDING = 16;
const ICON_TITLE_GAP = 16;
const RADIO_TITLE_GAP = 8;
const ICON_TITLE_HEADER_GAP = 8;
const TEXT_ROWS_GAP = 8;

const ROW_ITEM_GAP = 24;
const ROW_CARD_ITEM_GAP = 16;

const ScreenContainer = styled.div`
  padding: 0px;
  margin: 0px;
`;

const HeaderContainer = styled.header`
  padding: ${PADDING}px;
`;

const ContentContainer = styled.main`
  padding-top: ${CONTENT_PADDING_TOP}px;
  max-width: ${CONTENT_MAX_WIDTH}px;
  margin: 0 auto;
`;

const CardContainer = styled(Card)`
  padding: ${PADDING}px;
  @media (max-width: 768px) {
    padding: ${tokens.spacingVerticalM};
  }
`;

const FooterContainer = styled.footer`
  padding: ${PADDING}px;
`;

const IconTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${ICON_TITLE_GAP}px;
`;

const RadioTitleContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${RADIO_TITLE_GAP}px;
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

const RowCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${ROW_ITEM_GAP}px;
`;

const RowCardItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${ROW_CARD_ITEM_GAP}px;
`;

const MarginBottom = styled.div`
  margin-bottom: ${ROW_ITEM_GAP}px;
`;

const MarginTop = styled.div`
  margin-top: ${ROW_ITEM_GAP}px;
`;
export { 
    ScreenContainer, 
    HeaderContainer, 
    ContentContainer, 
    IconTitleContainer,
    IconTitleHeaderContainer,
    TextRowsContainer,
    RowSpaceBetween,
    RowItemContainer,
    RadioTitleContainer,
    RowCardContainer,
    RowCardItemContainer,
    CardContainer,
    FooterContainer,
    MarginBottom,
    MarginTop
};