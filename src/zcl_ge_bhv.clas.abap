CLASS zcl_ge_bhv DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.
   INTERFACES if_sadl_exit_calc_element_read.
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.



CLASS ZCL_GE_BHV IMPLEMENTATION.


 METHOD if_sadl_exit_calc_element_read~calculate.
    DATA: lt_GateEntryHeader TYPE STANDARD TABLE OF ZC_GateEntryHeader WITH DEFAULT KEY.
    lt_GateEntryHeader = CORRESPONDING #( it_original_data ).

    loop at lt_GateEntryHeader assigning FIELD-SYMBOL(<lfs_progressors>).

        if <lfs_progressors>-EntryType = 'PUR'.

            select SINGLE from I_MaterialDocumentHeader_2 as MTHead
            join I_MaterialDocumentItem_2 as MTDOCITem
            on MTDOCITem~MaterialDocument = MTHead~MaterialDocument and MTDOCITem~MaterialDocumentYear = MTHead~MaterialDocumentYear
            FIELDS MTHead~MaterialDocument, mthead~MaterialDocumentYear
            where MTHead~MaterialDocumentHeaderText = @<lfs_progressors>-GateEntryNo and MTDOCITem~GoodsMovementIsCancelled = '' and MTDOCITem~GoodsMovementType = '101'
            into @DATA(GRNDOC).

            if GRNDOC is not INITIAL.
                <lfs_progressors>-UpdateAllowed = abap_false.
            else.
                <lfs_progressors>-UpdateAllowed = abap_true.
            ENDIF.

        elseif <lfs_progressors>-EntryType = 'RGP-IN'.
            select single from ZR_GateEntryLines as Lines
            join ZR_GateEntryHeader as Header on Lines~DocumentNo = Header~GateEntryNo
            fields Header~GateEntryNo
            where Header~GateEntryNo = @<lfs_progressors>-GateEntryNo
            into @DATA(RGPEntry).

             if RGPEntry is not INITIAL.
                <lfs_progressors>-UpdateAllowed = abap_false.
            else.
                <lfs_progressors>-UpdateAllowed = abap_true.
            ENDIF.

        ENDIF.

    endloop.
    ct_calculated_data = CORRESPONDING #( lt_gateentryheader ).

  ENDMETHOD.


  METHOD if_sadl_exit_calc_element_read~get_calculation_info.

  ENDMETHOD.
ENDCLASS.
