/* eslint-disable no-undef */
$(() => {
    /**************************************************** 
     *               CHANGE TRADE URL                   *
     * **************************************************/
    $("#tradeurl-btn").click(() => {
        $("#tradeurl-modal").modal("toggle");
    })

    $(document).on('submit', "#change-tradeurl-form", function (e) {
        e.preventDefault();

        let tradeUrl = $('input[name="tradeurl"]').val();

        $.post("/dashboard/changetradeurl", { tradeUrl: tradeUrl }, () => {
            $("#tradeurl-modal").modal('toggle');
            setTimeout(() => alert("Trade URL changed."), 200);
        }).fail(xhr => {
            $('input[name="tradeurl"]').val("");
            alert(xhr.responseText)
        })
    })
});

