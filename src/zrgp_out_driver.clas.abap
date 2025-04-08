CLASS zrgp_out_driver DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.

    CLASS-DATA : access_token TYPE string .
    CLASS-DATA : xml_file TYPE string .
    TYPES :
      BEGIN OF struct,
        xdp_template TYPE string,
        xml_data     TYPE string,
        form_type    TYPE string,
        form_locale  TYPE string,
        tagged_pdf   TYPE string,
        embed_font   TYPE string,
      END OF struct."


    CLASS-METHODS :
      create_client
        IMPORTING url           TYPE string
        RETURNING VALUE(result) TYPE REF TO if_web_http_client
        RAISING   cx_static_check ,

      read_posts
        IMPORTING
                  lv_gateentry    TYPE string
*                  company_code     TYPE string
        RETURNING VALUE(result12) TYPE string
        RAISING   cx_static_check .

  PROTECTED SECTION.
  PRIVATE SECTION.

    CONSTANTS lc_ads_render TYPE string VALUE '/ads.restapi/v1/adsRender/pdf'.
    CONSTANTS  lv1_url    TYPE string VALUE 'https://adsrestapi-formsprocessing.cfapps.jp10.hana.ondemand.com/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2'  .
    CONSTANTS  lv2_url    TYPE string VALUE 'https://dev-tcul4uw9.authentication.jp10.hana.ondemand.com/oauth/token'  .
    CONSTANTS lc_storage_name TYPE string VALUE 'templateSource=storageName'.
    CONSTANTS lc_template_name TYPE string VALUE 'ZRGPOUT/ZRGPOUT'."'zpo/zpo_v2'."

ENDCLASS.



CLASS ZRGP_OUT_DRIVER IMPLEMENTATION.


  METHOD create_client .
    DATA(dest) = cl_http_destination_provider=>create_by_url( url ).
    result = cl_web_http_client_manager=>create_by_http_destination( dest ).
  ENDMETHOD .


  METHOD read_posts .

    SELECT SINGLE * FROM zgateentryheader WHERE gateentryno = @lv_gateentry
    INTO  @DATA(lv_header).

    SELECT * FROM zgateentrylines WHERE gateentryno = @lv_gateentry
    INTO TABLE @DATA(it_line).

    DATA : lv_count TYPE i .
    lv_count = 1.

    DATA(lv_xml) = |<Form>| &&
                    |<GateEntryNo>{ lv_header-gateentryno }</GateEntryNo>| &&
                    |<GateEntryDate>{ lv_header-gateindate }</GateEntryDate>| &&
                    |<GateEntryType>{ lv_header-entrytype }</GateEntryType>| &&
                    |<VendorCode>{ lv_header-invoiceparty }</VendorCode>| &&
                    |<VendorName>{ lv_header-invoicepartyname }</VendorName>| &&
                    |<Gstin>{ lv_header-invoicepartygst }</Gstin>| &&
                    |<PAN>{ '' }</PAN>| &&
                    |<PartyInvNo>{ lv_header-invoiceno }</PartyInvNo>| &&
                    |<PartDate>{ lv_header-invoicedate }</PartDate>| &&
                    |<VehicleNo>{ lv_header-vehicleno }</VehicleNo>| &&
                    |<Grosswt>{ lv_header-grosswt }</Grosswt>| &&
                    |<Netwt>{ lv_header-netwt }</Netwt>| &&
                    |<Tarewt>{ lv_header-tarewt }</Tarewt>| &&
                    |<ExpectedReturnDate>{ lv_header-invoicedate }</ExpectedReturnDate>| &&
                    |<Remarks>{ lv_header-remarks }</Remarks>| &&
                    |<Through>{ lv_header-transportmode }</Through>| &&
                    |<temp1>{ '' }</temp1>| &&

                    |<Table>|.

    DATA : lv_xml1 TYPE string .

    LOOP AT it_line INTO DATA(wa_lines).

      DATA(lv_xml2) = |<Item>| &&
       |<SRNO>{ lv_count }</SRNO>| &&
       |<PO>{ wa_lines-documentno }</PO>| &&
       |<POITEM>{ wa_lines-documentitemno }</POITEM>| &&
       |<MATERIAL>{ wa_lines-productcode }</MATERIAL>| &&
       |<MATDES>{ wa_lines-productdesc }</MATDES>| &&
       |<GATEQTY>{ wa_lines-gateqty }</GATEQTY>| &&
       |<UNIT>{ wa_lines-uom }</UNIT>| &&
       |<RATE>{ wa_lines-rate }</RATE>| &&
       |<AMOUNT>{ wa_lines-gatevalue }</AMOUNT>| &&
       |<GST>{ wa_lines-gst }</GST>| &&
       |<REMARKS>{ wa_lines-remarks }</REMARKS>| &&
       |</Item>|.

      CONCATENATE lv_xml1 lv_xml2 INTO lv_xml1.
      lv_count += 1.
    ENDLOOP.

    DATA(lv_xml3) =   |</Table>| &&
                      |</Form>|.

    CONCATENATE lv_xml lv_xml1 lv_xml3 INTO lv_xml.

    CALL METHOD zcl_ads_master=>getpdf(
      EXPORTING
        xmldata  = lv_xml
        template = lc_template_name
      RECEIVING
        result   = result12 ).

  ENDMETHOD.
ENDCLASS.
